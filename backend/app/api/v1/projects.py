import uuid
from fastapi import APIRouter,Depends,status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db,get_current_user
from app.schemas.project import ProjectCreate,ProjectResponse
from app.services.project_service import ProjectService
from app.models.user import User
from app.schemas.response import SuccessResponse

router = APIRouter(prefix="/projects",tags=["projects"])

@router.post("",response_model=SuccessResponse[ProjectResponse],status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in:ProjectCreate,
    db:AsyncSession= Depends(get_db),
    current_user: User= Depends(get_current_user)
) -> SuccessResponse[ProjectResponse]:
    service = ProjectService(db)
    project = await service.create_user_project(project_in, owner_id=current_user.id)
    return SuccessResponse(
        data=ProjectResponse.model_validate(project),
        message = "Project created successfully"
    )

@router.get("",response_model=SuccessResponse[list[ProjectResponse]])
async def list_project(
    db:AsyncSession= Depends(get_db),
    current_user: User= Depends(get_current_user)
):
    service = ProjectService(db)
    projects = await service.get_user_project(owner_id=current_user.id)
    return SuccessResponse(
        data=[ProjectResponse.model_validate(project) for project in projects],
        message= "Data fetch successfully"
    )

@router.get("/{id}", response_model=SuccessResponse[ProjectResponse])
async def get_project(id:uuid.UUID,db:AsyncSession=Depends(get_db),current_user:User=Depends(get_current_user)):
    '''
    get details for single project.
    -Enforce ownership security checks
    '''
    service= ProjectService(db)
    project = await service.get_project_with_auth(project_id=id,user_id=current_user.id)
    return SuccessResponse(data=ProjectResponse.model_validate(project))

@router.delete("/{id}",status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    id:uuid.UUID,
    db:AsyncSession= Depends(get_db),
    current_user: User= Depends(get_current_user)
):
    service = ProjectService(db)
    await service.delete_user_project(project_id=id, user_id=current_user.id)