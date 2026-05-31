import uuid
from fastapi import HTTPException,status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.issue_repo import IssueRepository
from app.services.project_service import ProjectService
from app.schemas.issue import IssueCreate, IssueUpdate
from app.models.issue import Issue

class IssueService:
    def __init__(self, db:AsyncSession):
        self.repo = IssueRepository(db)
        self.project_service = ProjectService(db)

    async def create_issue(self, issue_in: IssueCreate, user_id:uuid.UUID) -> Issue:
        '''
        Enforce that the user owns the project container before allowing issue injection
        '''
        await self.project_service.get_project_with_auth(issue_in.project_id, user_id)
        return await self.repo.create(issue_in,reporter_id=user_id)
    
    async def get_project_issues(self, project_id:uuid.UUID, user_id: uuid.UUID) -> Issue:
        # Enfore project authorization checks 
        # it check if project belong to that user
        await self.project_service.get_project_with_auth(project_id ,user_id)
        return await self.repo.get_multi_by_project(project_id)
    
    async def update_issue(self,issue_id:uuid.UUID, issue_in: Issue, user_id= uuid.UUID) -> Issue:
        issue = await self.repo.get_by_id(issue_id)
        if not issue:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Issue not found"
            )
        # verify ownership of the parent project
        await self.project_service.get_project_with_auth(issue.project_id, user_id)
        # extract only fields explicitly sent by client , filtering out unset defaults
        update_data = issue_in.model_dump(exclude_unset=True)
        return await self.repo.update(issue,update_data)
    
    async def delete_issue(self,issue_id:uuid.UUID,user_id:uuid.UUID) -> None:
        issue = await self.repo.get_by_id(issue_id)
        if not issue:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
        # authorization check 
        # if the user that is deleting the issue have permission to access the project
        await self.project_service.get_project_with_auth(issue.project_id, user_id)
        await self.repo.delete(issue)
        

         