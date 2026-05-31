import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

class UserRepository:
    '''
    Repository class for User model. 
    Encapsulates all database operations related to users, providing a clean interface for the rest of the application.
    '''
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self,user_id: uuid.UUID) -> User | None:
        '''
        Fetch a user by their unique ID.
        '''
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
    
    async def get_by_email(self,email: str) -> User | None:
        '''
        Fetch a user by their email address.
        '''
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()
    
    async def create(self, user_create: UserCreate) -> User:
        '''
        Create a new user in the database.
        Hashes the password before saving.
        '''
        db_user = User(
            email=user_create.email,
            full_name=user_create.full_name,
            hashed_password=get_password_hash(user_create.password)
        )
        self.db.add(db_user)
        await self.db.commit()
        await self.db.refresh(db_user)
        return db_user
        