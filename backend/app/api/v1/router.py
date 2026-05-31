from fastapi import APIRouter
from app.api.v1 import auth,projects, issues

api_router = APIRouter()

# register auth endpoints
api_router.include_router(auth.router)
api_router.include_router(projects.router)
api_router.include_router(issues.router)