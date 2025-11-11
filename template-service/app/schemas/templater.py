"""Template schemas"""

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


class TemplateCreate(BaseModel):
    """Create Schema"""

    name: str
    header: str
    subtitle: str | None = None
    content: str
    template_type: TemplateType


class TemplateUpdate(BaseModel):
    """Update schema"""

    header: str | None = None
    subtitle: str | None = None
    content: str | None = None
    is_active: bool | None = None


class TemplateOut(BaseSchema):
    """Response Schema"""

    id: UUID
    name: str
    header: str
    subtitle: str | None
    content: str
    template_type: TemplateType
    version: int
    is_active: bool
    creator_user_id: str
    creator_user_name: str | None
    created_at: datetime
    updated_at: datetime | None

    model_config = {"from_attributes": True}
