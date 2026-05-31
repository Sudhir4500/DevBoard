from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.schemas.response import ErrorResponse
from app.core.config import settings
import traceback


def setup_exception_handlers(app: FastAPI):
    '''
    -custom exception handlers for the app.
    -it raises HTTPException anywhere in the code
    -fastapi will catch it and return a JSON response with the error message and status code.
    '''
    @app.exception_handler(HTTPException)
    async def http_exception_handler(
        request: Request,
        exc: HTTPException
    ):
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(
                message=str(exc.detail),
                errors=None,
            ).model_dump()
        )


    '''
    -handles validation errors that occur when the request body or query parameters do not match the expected schema.
    -it extracts the validation errors and returns a structured JSON response with the error details.
    '''
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: RequestValidationError
    ):
        errors = [
            {
                "field": ".".join(map(str, error["loc"][1:])),  # skip 'body' or 'query' etc.
                "message": error["msg"],
            }
            for error in exc.errors()
        ]

        return JSONResponse(
            status_code=422,
            content=ErrorResponse(
                message="Validation failed",
                errors=errors,
            ).model_dump()
        )

    '''
    -catches any unhandled exceptions that occur during request processing.
    -it returns a generic error message to the client, 
    -if DEBUG mode is enabled, it includes the exception details and traceback in the response for easier debugging.
    '''
    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request,
        exc: Exception
    ):
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                message="Internal server error",
                errors=(
                    {
                        "exception": type(exc).__name__,
                        "detail": str(exc),
                        "traceback": traceback.format_exc(),
                    }
                    if settings.DEBUG
                    else None
                ),
            ).model_dump()
        )