from datetime import datetime
from sqlmodel import SQLModel, Field, Column, Enum as SQLEnum, DateTime, func
from uuid import UUID, uuid4
from app.schemas.templater import TemplateType


class Template(SQLModel, table=True):
    """User Model"""

    id: UUID | None = Field(default_factory=uuid4, primary_key=True)
    name: str
    header: str
    subtitle: str | None = None
    content: str
    template_type: TemplateType = Field(
        sa_column=Column(
            SQLEnum(
                TemplateType, name="templatetype", create_type=False, native_enum=False
            ),
            nullable=False,
        )
    )
    version: int
    is_active: bool = True
    creator_user_id: str
    creator_user_name: str | None = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime | None = Field(
        sa_column=Column(DateTime(timezone=True), onupdate=func.now()), default=None
    )
