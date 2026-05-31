import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.project_repo import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectResponse
from app.models import Project

class ProjectService:
    def __init__(self, db: AsyncSession):
        self.project_repo = ProjectRepository(db)

    async def create_user_project(self, project_in:ProjectCreate,owner_id:uuid.UUID)-> Project:
        return await self.project_repo.create(project_in, owner_id=owner_id)
    
    async def get_user_project(self,owner_id:uuid.UUID) -> list[Project]:
        return await self.project_repo.get_multiple_by_owner(owner_id)
    
    '''
    -get the project thats belong to owner
    -not accessible to other 
    '''
    async def get_project_with_auth(self,project_id:uuid.UUID,user_id:uuid.UUID)->Project:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="project not found")
        if project.owner_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this project")
        return project
    
    async def delete_user_project(self, project_id:uuid.UUID, user_id:uuid.UUID) -> None:
        # reuse previous function to confirm ownership of project 
        await self.get_project_with_auth(project_id,user_id)
        await self.project_repo.delete(project_id)
