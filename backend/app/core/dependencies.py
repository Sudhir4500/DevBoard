from typing import AsyncGenerator
from fastapi import Depends,HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.security import ALGORITHM
from app.db.session import AsyncSessionLocal
from app.models.user import User

import uuid


oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides an async database session.
    Ensure session is open for the duration of the request and properly closed after finish.
    """
    async with AsyncSessionLocal() as session:
        yield session

async def get_current_user(
        db: AsyncSession = Depends(get_db),
        token:str = Depends(oauth2_scheme)
) -> User:
    """
    Resuable dependency to protect endpoints.
    Intercepts the REquest Auth header, decodes the JWT token, and retrieves the corresponding user from the database.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user