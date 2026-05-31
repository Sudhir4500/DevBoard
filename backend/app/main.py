from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
import app.models
from app.api.v1.router import api_router
from app.core.exceptions import setup_exception_handlers

def create_application() -> FastAPI:
    '''
    App factory pattern. configure and returns a fully initialized fastApi instance.
    This structure isolates configurations and allows clean test setup overrides
    '''
    application = FastAPI(
        title = settings.PROJECT_NAME,
        openapi_url = f"{settings.API_V1_STR}/openapi.json",
        docs_url= f"{settings.API_V1_STR}/docs"
    )

    # cross-origin sharing (cors) middleware setup
    # used for allowing client side to communicate with api
    application.add_middleware(
        CORSMiddleware,
        allow_origins=['*'], #allow all
        allow_credentials=True,
        allow_methods =["*"],
        allow_headers=["*"],
    )

    @application.get("/",tags=["Health"])
    async def health_check():
        return{
            "status":"healthy",
            "project":settings.PROJECT_NAME
    }
    # setup custom exception handlers for better error responses
    setup_exception_handlers(application)

    application.include_router(api_router, prefix=settings.API_V1_STR)

    return application

app =create_application()
