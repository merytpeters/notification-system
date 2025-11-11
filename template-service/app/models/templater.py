"""Template and Template Version Models"""

from typing import List, Optional
from datetime import datetime
from sqlmodel import (
    SQLModel,
    Field,
    Column,
    Enum as SQLEnum,
    DateTime,
    func,
    Relationship,
)
from uuid import UUID, uuid4
from app.schemas.templater import TemplateType


class Template(SQLModel, table=True):
    """Template Model"""

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str
    description: Optional[str] = None
    template_type: TemplateType = Field(
        sa_column=Column(
            SQLEnum(
                TemplateType, name="templatetype", create_type=False, native_enum=False
            ),
            nullable=False,
        )
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    versions: List["TemplateVersion"] = Relationship(back_populates="template")


class TemplateVersion(SQLModel, table=True):
    """TemplateVersion Model"""

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    template_id: UUID = Field(foreign_key="template.id", nullable=False)
    version: int = Field(index=True)
    header: str
    subtitle: str | None = None
    content: str
    is_active: bool = Field(default=True)
    creator_user_id: str
    creator_user_name: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime | None = Field(
        sa_column=Column(DateTime(timezone=True), onupdate=func.now()), default=None
    )
    template: "Template" = Relationship(back_populates="versions")
