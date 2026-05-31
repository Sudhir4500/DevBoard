import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.schemas.issue import IssueCreate, IssueUpdate, IssueResponse
from app.services.issue_service import IssueService
from app.models.user import User
from app.schemas.response import SuccessResponse

router = APIRouter(prefix="/issues", tags=["issues"])

@router.post("",response_model=SuccessResponse[IssueResponse], status_code=status.HTTP_201_CREATED)
async def create_issue(
    issue_in: IssueCreate,
    db:AsyncSession= Depends(get_db),
    current_user:User = Depends(get_current_user)
):
    '''
    create a issue inside owned project
    '''
    service = IssueService(db)
    result = await service.create_issue(issue_in, user_id=current_user.id)
    return SuccessResponse(
        data=IssueResponse.model_validate(result),
        message="Issue created successfully"
    )

@router.get("",response_model=SuccessResponse[list[IssueResponse]])
async def list_project_issues(
    project_id:uuid.UUID,
    db:AsyncSession = Depends(get_db),
    current_user: User =Depends(get_current_user)
):
    '''
    Retrive all issue belonging to specific project.
    '''
    service = IssueService(db)
    result = await service.get_project_issues(project_id, user_id=current_user.id)
    return SuccessResponse(
        data=[IssueResponse.model_validate(issue) for issue in result]
    )

@router.patch("/{id}",response_model=SuccessResponse[IssueResponse])
async def update_issue(
    id: uuid.UUID,
    issue_in:IssueUpdate,
    db:AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    '''
    partially update the issue
    '''
    service = IssueService(db)
    result = await service.update_issue(issue_id=id,issue_in=issue_in, user_id=current_user.id)
    return SuccessResponse(
        data=IssueResponse.model_validate(result)
    )

@router.delete("/{id}",status_code=status.HTTP_204_NO_CONTENT)
async def delete_issue(
    id:uuid.UUID,
    db:AsyncSession=Depends(get_db),
    current_user:User=Depends(get_current_user)
):
    service = IssueService(db),
    await service.delete_issue(issue_id=id, user_id= current_user.id)
    return None

    