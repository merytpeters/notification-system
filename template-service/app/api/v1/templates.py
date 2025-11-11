from fastapi import APIRouter
from fastapi.templating import Jinja2Templates
from app.core.db import get_session
from app.models.templater import Template
from app.schemas.templater import TemplateCreate, TemplateOut, TemplateUpdate


templates = Jinja2Templates(directory="app/templates")
router = APIRouter()


@router.get("/")
def get_templates():
    pass


@router.get("/{template_id}")
def get_template():
    pass


@router.post("/")
def create_template():
    pass


@router.patch("/{template_id}")
def patch_template():
    pass


@router.put("/{template_id}")
def update_template():
    pass


@router.get("/{type}")
def get_template_by_type():
    pass


@router.get("/{version}")
def get_template_by_version():
    pass


@router.get("/preview/{template_id}")
async def preview_template():
    pass
