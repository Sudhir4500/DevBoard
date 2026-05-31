import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ProjectBase(BaseModel):
    name: str
    description: str | None = None

class ProjectCreate(ProjectBase):
    '''
    -what a client needs to provide when creating a new project.
    '''
    pass

class ProjectResponse(ProjectBase):
    '''
    -what the API returns when fetching project data.
    -includes additional fields like id, created_at, and updated_at.
    '''
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,  # allows creating from ORM objects
    )