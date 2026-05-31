import uuid
from datetime import datetime, timezone
from sqlalchemy import String,Text,DateTime,ForeignKey,Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
import enum


class IssueStatus(str, enum.Enum):
    BACKLOG = "BACKLOG"
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"

class IssuePriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class Issue(Base):
    __tablename__="issues"

    id:Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255),nullable=False)
    description: Mapped[str| None] = mapped_column(Text,nullable=True)

    status: Mapped[IssueStatus] = mapped_column(Enum(IssueStatus), default=IssueStatus.TODO,nullable=False)
    priority: Mapped[IssuePriority] = mapped_column(Enum(IssuePriority), default=IssuePriority.LOW,nullable=False)

    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"),nullable=False)
    reporter_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"),nullable=False)
    assignee_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"),nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="issues")