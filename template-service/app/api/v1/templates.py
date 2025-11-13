import json
import os
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.templating import Jinja2Templates
from sqlmodel import Session, select
from uuid import uuid4, UUID
from app.api.external_services import get_email_settings, get_user
from app.core.redis_manager import get_redis
from app.core.db import get_session
from app.models.templater import Template, TemplateVersion
from app.schemas.templater import (
    TemplateCreate,
    TemplateOut,
    TemplateUpdate,
    TemplateVersionOut,
    TemplateVersionCreate,
    TemplateType,
    TemplatePatch,
    TemplateRenderSchema,
    TemplateVersionUpdate,
    PreviewRequest,
)


templates = Jinja2Templates(directory="app/templates")
router = APIRouter()


@router.get("/", response_model=List[TemplateOut], status_code=status.HTTP_200_OK)
def get_templates(session: Session = Depends(get_session)):
    """
    Get all templates.
    Returns a list of templates including their versions.
    """
    if session is None:
        raise HTTPException(status_code=500, detail="Database session is not available")

    statement = select(Template)
    templates = session.exec(statement).all()

    return templates


@router.post("/", response_model=TemplateOut, status_code=status.HTTP_201_CREATED)
def create_template(
    template_in: TemplateCreate, session: Session = Depends(get_session)
):
    """Create template and template version"""
    # Create template and commit to db
    template = Template(
        id=uuid4(),
        name=template_in.name,
        description=template_in.description,
        template_type=template_in.template_type,
    )

    session.add(template)
    session.commit()
    session.refresh(template)

    version_data = template_in.initial_version
    # create template version and commit to db
    template_version = TemplateVersion(
        id=uuid4(),
        template_id=template.id,
        version=1,
        header=version_data.header,
        subtitle=version_data.subtitle,
        content=version_data.content,
        is_active=version_data.is_active,
        creator_user_id=version_data.creator_user_id,
        creator_user_name=version_data.creator_user_name,
        created_at=datetime.utcnow(),
    )

    session.add(template_version)
    session.commit()
    session.refresh(template_version)

    template.versions = [template_version]

    return template


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def delete_all_templates(session: Session = Depends(get_session)):
    """
    Delete all templates and all their versions.
    """
    templates = session.exec(select(Template)).all()

    if not templates:
        raise HTTPException(status_code=404, detail="No templates found to delete")

    for template in templates:
        for version in template.versions:
            session.delete(version)
        session.delete(template)

    session.commit()
    return


@router.get(
    "/{template_id}", response_model=TemplateOut, status_code=status.HTTP_200_OK
)
def get_template(template_id: UUID, session: Session = Depends(get_session)):
    """Get Template"""
    if session is None:
        raise HTTPException(status_code=500, detail="Database session is not available")
    statement = select(Template).where(Template.id == template_id)
    template = session.exec(statement).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.patch(
    "/{template_id}", response_model=TemplateOut, status_code=status.HTTP_200_OK
)
def patch_template(
    template_id: UUID,
    template_data: TemplatePatch,
    session: Session = Depends(get_session),
):
    """
    Partially update a template (PATCH).
    Only updates fields provided in the request body.
    """
    template = session.get(Template, template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Template not found"
        )

    update_data = template_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(template, key, value)

    session.add(template)
    session.commit()
    session.refresh(template)
    return template


@router.put(
    "/{template_id}", response_model=TemplateOut, status_code=status.HTTP_200_OK
)
def update_template(
    template_id: UUID,
    template_data: TemplateUpdate,
    session: Session = Depends(get_session),
):
    """
    Fully update a template (PUT).
    All fields must be provided.
    """
    template = session.get(Template, template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Template not found"
        )

    # Overwrite all fields
    template.name = template_data.name
    template.description = template_data.description
    template.template_type = template_data.template_type

    session.add(template)
    session.commit()
    session.refresh(template)
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template_and_versions(
    template_id: UUID, session: Session = Depends(get_session)
):
    """
    Delete a single template and all its versions.
    """
    template = session.get(Template, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    for version in template.versions:
        session.delete(version)

    session.delete(template)
    session.commit()
    return


@router.post(
    "/{template_id}/versions",
    response_model=TemplateVersionOut,
    status_code=status.HTTP_201_CREATED,
)
def create_new_template_version(
    template_id: UUID,
    version_in: TemplateVersionCreate,
    session: Session = Depends(get_session),
):
    """Create a new version of an existing template"""
    template = session.get(Template, template_id)
    if not template:
        raise HTTPException(404, "This template does not exist in db")

    max_version = max([v.version for v in template.versions], default=0)
    new_version = TemplateVersion(
        template_id=template_id,
        version=max_version + 1,
        header=version_in.header,
        subtitle=version_in.subtitle,
        content=version_in.content,
        is_active=version_in.is_active,
        creator_user_id=version_in.creator_user_id,
        creator_user_name=version_in.creator_user_name,
    )

    session.add(new_version)
    session.commit()
    session.refresh(new_version)
    return new_version


@router.get(
    "/type/{template_type}",
    response_model=List[TemplateOut],
    status_code=status.HTTP_200_OK,
)
def get_template_by_type(
    template_type: TemplateType, session: Session = Depends(get_session)
):
    """
    Get all templates of a specific type (email, push, in_app, etc.).
    """
    statement = select(Template).where(Template.template_type == template_type.value)
    templates = session.exec(statement).all()
    if not templates:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No templates of type '{template_type.value}' found",
        )
    return templates


@router.get(
    "/{template_id}/{version_number}",
    response_model=TemplateVersionOut,
    status_code=status.HTTP_200_OK,
)
def get_template_by_version(
    template_id: UUID, version_number: int, session: Session = Depends(get_session)
):
    """Get Template Version by Number"""
    statement = select(TemplateVersion).where(
        TemplateVersion.template_id == template_id,
        TemplateVersion.version == version_number,
    )
    version = session.exec(statement).first()
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Template version not found"
        )
    return version


@router.patch(
    "/{template_id}/versions/{version_number}",
    response_model=TemplateVersionOut,
    status_code=200,
)
def update_template_version_by_number(
    template_id: UUID,
    version_number: int,
    version_data: TemplateVersionUpdate,
    session: Session = Depends(get_session),
):
    """
    Partially update a template version identified by template_id and version number.
    """
    version = session.exec(
        select(TemplateVersion).where(
            TemplateVersion.template_id == template_id,
            TemplateVersion.version == version_number,
        )
    ).first()

    if not version:
        raise HTTPException(status_code=404, detail="Template version not found")

    update_data = version_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(version, key, value)

    session.add(version)
    session.commit()
    session.refresh(version)
    return version


@router.post("/preview/{template_id}/{user_id}")
async def preview_template(
    template_id: UUID,
    user_id: str,
    request_body: PreviewRequest,
    request: Request,
    session: Session = Depends(get_session),
):
    redis = await get_redis()

    # --- Cache template version ---
    template_cache_key = f"template:{template_id}:latest_version"
    cached_version = await redis.get(template_cache_key)
    if cached_version:
        version = json.loads(cached_version)
    else:
        template = session.get(Template, template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        if not template.versions:
            raise HTTPException(
                status_code=404, detail="No versions available for this template"
            )

        latest_version = sorted(template.versions, key=lambda v: v.version)[-1]
        version = latest_version.model_dump()
        await redis.set(template_cache_key, json.dumps(version), ex=300)

    user_service_url = request_body.user_service_url or os.getenv("USER_SERVICE_URL")
    email_service_url = request_body.email_service_url or os.getenv("EMAIL_SERVICE_URL")

    # --- User data ---
    user_cache_key = f"user:{user_id}"
    cached_user = await redis.get(user_cache_key)
    if cached_user:
        user_data = json.loads(cached_user)
    else:
        user_data = await get_user(user_id, base_url=user_service_url)
        await redis.set(user_cache_key, json.dumps(user_data), ex=300)

    # --- Email settings ---
    email_cache_key = f"email_settings:{user_id}"
    cached_email = await redis.get(email_cache_key)
    if cached_email:
        email_settings = json.loads(cached_email)
    else:
        email_settings = await get_email_settings(user_id, base_url=email_service_url)
        await redis.set(email_cache_key, json.dumps(email_settings), ex=300)

    # --- Render template ---
    render_data = TemplateRenderSchema(
        name=version["name"],
        description=version.get("description"),
        version=version["version"],
        header=version["header"],
        subtitle=version.get("subtitle"),
        content=version["content"],
        type=version["type"],
        user=user_data,
    )

    return templates.TemplateResponse(
        "notification.html",
        {
            "request": request,
            **render_data.model_dump(),
            "email_settings": email_settings,
        },
    )


@router.delete(
    "/{template_id}/versions/{version_number}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_version_by_number(
    template_id: UUID, version_number: int, session: Session = Depends(get_session)
):
    """
    Delete a template version using its version number within a template.
    """
    statement = select(TemplateVersion).where(
        TemplateVersion.template_id == template_id,
        TemplateVersion.version == version_number,
    )
    version = session.exec(statement).first()

    if not version:
        raise HTTPException(status_code=404, detail="Template version not found")

    session.delete(version)
    session.commit()
    return
