"""
Pydantic schemas for API requests and responses.
"""
from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ServiceActionRequest(BaseModel):
    service: str
    action: str  # start, stop, restart, logs, test_config
