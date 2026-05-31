from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserCreate
from app.core.security import verify_password, create_access_token
from app.models.user import User

class UserService:
    '''
    Service layer for user-related operations. 
    Contains business logic for user registration, authentication, and retrieval.
    '''
    def __init__(self, db:AsyncSession):
        self.repo = UserRepository(db)

    async def register_user(self,user_create:UserCreate) -> User:
        '''
        Registers a new user. 
        Checks for existing email and creates a new user if email is unique.
        '''
        existing_user = await self.repo.get_by_email(user_create.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        return await self.repo.create(user_create)
    
    async def authenticate_user(self,email: str, password: str) -> str:
        '''
        Authenticates a user by email and password.
        Returns the access token if authentication is successful, otherwise raises an exception.
        '''
        user = await self.repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"}
            )
        access_token = create_access_token(
            subject=user.id
        )
        return access_token