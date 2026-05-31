from fastapi import APIRouter,Depends,status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.schemas.user import UserCreate, UserResponse, Token
from app.services.user_service import UserService
from app.models.user import User
from app.schemas.response import SuccessResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])
    
@router.post("/register", response_model=SuccessResponse[UserResponse], status_code=status.HTTP_201_CREATED)
async def register(user_create: UserCreate, db: AsyncSession = Depends(get_db)):
    '''
    Endpoint for user registration. 
    Accepts user details, creates a new user, and returns the created user's information.
    '''
    service = UserService(db)
    user = await service.register_user(user_create)
    return SuccessResponse(data=UserResponse.model_validate(user), message="User registered successfully")

@router.post("/login", response_model=SuccessResponse[Token])
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: AsyncSession = Depends(get_db)
):
    '''
    Endpoint for user login. 
    Accepts email and password, authenticates the user, and returns an access token if successful.
    '''
    service = UserService(db)
    access_token = await service.authenticate_user(
        email=form_data.username, 
        password=form_data.password
    )
    return SuccessResponse(data=Token(access_token=access_token, token_type="bearer"))

@router.get("/me", response_model=SuccessResponse[UserResponse])
async def get_authenticated_user(current_user: User = Depends(get_current_user)):
    '''
    Endpoint to fetch the currently authenticated user's information.
    Requires a valid access token in the request header.
    '''
    return SuccessResponse(data=UserResponse.model_validate(current_user), message="User information retrieved successfully")