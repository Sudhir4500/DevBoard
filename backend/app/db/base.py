'''
Base class for all SQLAlchemy models
it ensures that all models inherit from a common parent class
This is important for several reasons:
1. It allows us to define common behavior or attributes for all models in one place.
2. It provides a consistent way to create tables and manage the database schema.
3. It simplifies the import and usage of models throughout the application.
'''

from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    '''
    unified base class for all SQLAlchemy models. 
    Every database model we write will inherit from this class
    '''
    pass
