import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.issue import IssueStatus, IssuePriority


class IssueBase(BaseModel):
    title:str
    description:str | None = None
    status:IssueStatus = IssueStatus.TODO
    priority: IssuePriority = IssuePriority.LOW
    assignee_id: uuid.UUID | None = None

class IssueCreate(IssueBase):
    project_id: uuid.UUID

class IssueUpdate(BaseModel):
    '''
    -Enable the partial update.
    -Every field is optional here
    -client only send the field that require to change
    '''
    title:str | None = None
    description:str | None = None
    status:IssueStatus | None = None
    priority: IssuePriority | None = None
    assignee_id: uuid.UUID | None = None

class IssueResponse(IssueBase):
    '''
    it return the standardized api response
    '''
    id: uuid.UUID
    project_id : uuid.UUID
    reporter_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)