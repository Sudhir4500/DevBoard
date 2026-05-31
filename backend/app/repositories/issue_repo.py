import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.issue import Issue
from app.schemas.issue import IssueCreate

class IssueRepository:
    def __init__(self,db:AsyncSession):
        self.db = db
    async def get_by_id(self,issue_id:uuid.UUID)-> Issue | None:
        result = await self.db.execute(select(Issue).where(Issue.id == issue_id))
        return result.scalar_one_or_none()
    
    async def get_multi_by_project(self, project_id:uuid.UUID) -> list[Issue]:
        '''
        fetch all the issue belonfing to project
        '''
        result = await self.db.execute(select(Issue).where(Issue.project_id == project_id))
        return list(result.scalars().all())
    
    async def create (self, issue_in:IssueCreate, reporter_id:uuid.UUID) -> Issue:
        db_issue = Issue(
            title = issue_in.title,
            description = issue_in.description,
            status = issue_in.status,
            priority = issue_in.priority,
            assignee_id = issue_in.assignee_id,
            reporter_id = reporter_id,
            project_id=issue_in.project_id
        )
        self.db.add(db_issue)
        await self.db.commit()
        await self.db.refresh(db_issue)
        return db_issue
    
    async def update(self, db_issue:Issue, update_dict: dict) ->  Issue:
        for key, value in update_dict.items():
            setattr(db_issue, key ,value)
        await self.db.commit()
        await self.db.refresh(db_issue)
        return db_issue

    async def delete(self, db_issue:Issue) -> None:
        await self.db.delete(db_issue)
        await self.db.commit()
