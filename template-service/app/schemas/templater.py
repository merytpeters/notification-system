"""Template schemas"""

from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime, timezone
from uuid import UUID
import enum


class BaseSchema(BaseModel):
    model_config = {
        "json_encoders": {
            datetime: lambda v: (
                v.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
                if v
                else None
            )
        }
    }


class TemplateType(str, enum.Enum):
    """Template Type (Email/SMS/Notification)"""

    EMAIL = "email"
    PUSH = "push"
    SMS = "sms"
    IN_APP = "in_app"
    WEB = "web"


class TemplateVersionCreate(BaseModel):
    """Initial version creation"""

    header: str
    subtitle: Optional[str] = None
    content: str
    is_active: Optional[bool] = True
    creator_user_id: str
    creator_user_name: Optional[str] = None


class TemplateVersionUpdate(BaseModel):
    """Update a specific template version"""

    header: Optional[str] = None
    subtitle: Optional[str] = None
    content: Optional[str] = None
    is_active: Optional[bool] = None


class TemplateVersionOut(BaseSchema):
    """Template version output"""

    id: UUID
    template_id: UUID
    version: int
    header: str
    subtitle: Optional[str] = None
    content: str
    is_active: bool
    creator_user_id: str
    creator_user_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


class TemplateCreate(BaseModel):
    """Create a new template along with its initial version"""

    name: str
    description: Optional[str] = None
    template_type: TemplateType
    initial_version: TemplateVersionCreate


class TemplateUpdate(BaseModel):
    """Update template metadata (not version content)"""

    description: Optional[str] = None
    template_type: Optional[TemplateType] = None


class TemplateOut(BaseSchema):
    """Template with versions"""

    id: UUID
    name: str
    description: Optional[str] = None
    template_type: TemplateType
    created_at: datetime
    versions: List[TemplateVersionOut]

    model_config = {"from_attributes": True}
