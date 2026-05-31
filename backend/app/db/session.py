from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

# create the async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG, # log SQL queries in debug mode
)

# create a session factory for async sessions
AsyncSessionLocal = async_sessionmaker(
    bind=engine, # use the async engine
    class_ =AsyncSession, # use the async session class
    expire_on_commit=False, # prevent automatic expiration of objects after commit
    autocommit=False, # disable autocommit, we will manage transactions manually
    autoflush=False, # disable autoflush, we will control when to flush changes to the database
)