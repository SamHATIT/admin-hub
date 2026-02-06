"""
Auth router - JWT login, token validation, password change.
"""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel

from config import settings
from models.schemas import LoginRequest
from services.credentials_service import (
    verify_password,
    get_username,
    is_password_expired,
    password_days_remaining,
    change_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer()


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    password_expired: bool = False
    password_days_remaining: int = 90


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Dependency: validate JWT token and return username."""
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=["HS256"])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Authenticate and return JWT token with password expiry info."""
    if request.username != get_username():
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(request.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": request.username})
    return LoginResponse(
        access_token=token,
        password_expired=is_password_expired(),
        password_days_remaining=password_days_remaining(),
    )


@router.post("/change-password")
async def change_password_endpoint(
    request: ChangePasswordRequest,
    user: str = Depends(get_current_user),
):
    """Change password (requires valid JWT)."""
    result = change_password(request.old_password, request.new_password)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"success": True, "message": "Mot de passe modifié avec succès"}
