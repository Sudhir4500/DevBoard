import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict

class UserBase(BaseModel):
    '''
    Shared properties across all User schemas.
    used for request validation and response serialization.    
    '''
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    '''
     what api expects when a user registers
    '''
    password: str

class UserResponse(UserBase):
    '''
    what api returns when a user is created or fetched
    '''
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    # configure pydantic to read data from orm object
    # eg user_orm_instance.email() instead of just a standard dictionarylike user_dict['email']
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    '''
    Schema for access token response
    '''
    access_token: str
    token_type: str