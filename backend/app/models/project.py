import uuid
from datetime import datetime, timezone
from sqlalchemy import String,TEXT,DateTime,ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from typing import List

from app.models.issue import Issue

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100),nullable=False)
    description: Mapped[str | None] = mapped_column(TEXT, nullable=True)

    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id',ondelete='CASCADE'),nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    owner: Mapped["User"] = relationship("User",back_populates="owned_projects")
    issues: Mapped[List["Issue"]]=relationship("Issue",back_populates="project", cascade="all,delete-orphan")