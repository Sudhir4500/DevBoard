from typing import Any, Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")

# --- Success shape ---
class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
    message:str | None = None

# --- Error shapes ---
class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Any | None = None

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    errors: Any | None = None   # matches your documented standard exactly