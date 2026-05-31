import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Project
from app.schemas.project import ProjectCreate

class ProjectRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self,project_id: uuid.UUID) -> Project | None:
        '''
        -fetches a project by its unique identifier.
        '''
        result = await self.db.execute(
            select(Project).where(Project.id == project_id)
        )
        return result.scalar_one_or_none()

    async def get_multiple_by_owner(self, owner_id: uuid.UUID) -> list[Project]:
        '''
        -retrieves all projects owned by a specific user.
        '''
        result = await self.db.execute(
            select(Project).where(Project.owner_id == owner_id)
        )
        return list(result.scalars().all())
    
    async def create(self, project_data: ProjectCreate, owner_id: uuid.UUID) -> Project:
        '''
        -creates a new project with the provided data and associates it with the owner.
        '''
        new_project = Project(
            name=project_data.name,
            description=project_data.description,
            owner_id=owner_id,
        )
        self.db.add(new_project)
        await self.db.commit()
        await self.db.refresh(new_project)
        return new_project
    
    async def delete(self,project_id: uuid.UUID) -> bool:
        '''
        delete a project resource.
        cascades auto to issue via Db rules.
        '''
        project = await self.get_by_id(project_id)
        if not project:
            return False
        await self.db.delete(project)
        await self.db.commit()
        return True
    