"""
Credentials management with password expiry tracking.
Stores credentials in a JSON file for persistence across restarts.
"""
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from passlib.context import CryptContext
from config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

CREDENTIALS_FILE = Path(os.getenv(
    "CREDENTIALS_FILE",
    "/root/workspace/admin-hub/backend/credentials.json"
))

PASSWORD_MAX_AGE_DAYS = int(os.getenv("PASSWORD_MAX_AGE_DAYS", "90"))  # 90 days = ~3 months


def _load() -> dict:
    """Load credentials from file, or create from config defaults."""
    if CREDENTIALS_FILE.exists():
        with open(CREDENTIALS_FILE) as f:
            return json.load(f)
    # First run: initialize from config.py defaults
    data = {
        "username": settings.ADMIN_USERNAME,
        "password_hash": settings.ADMIN_PASSWORD_HASH,
        "password_changed_at": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _save(data)
    return data


def _save(data: dict):
    """Persist credentials to file."""
    with open(CREDENTIALS_FILE, "w") as f:
        json.dump(data, f, indent=2)


def verify_password(password: str) -> bool:
    """Check password against stored hash."""
    creds = _load()
    return pwd_context.verify(password, creds["password_hash"])


def get_username() -> str:
    return _load()["username"]


def is_password_expired() -> bool:
    """Check if password needs renewal (> PASSWORD_MAX_AGE_DAYS)."""
    creds = _load()
    changed_at = datetime.fromisoformat(creds["password_changed_at"])
    age_days = (datetime.now(timezone.utc) - changed_at).days
    return age_days >= PASSWORD_MAX_AGE_DAYS


def password_days_remaining() -> int:
    """Days until password expires."""
    creds = _load()
    changed_at = datetime.fromisoformat(creds["password_changed_at"])
    age_days = (datetime.now(timezone.utc) - changed_at).days
    return max(0, PASSWORD_MAX_AGE_DAYS - age_days)


def change_password(old_password: str, new_password: str) -> dict:
    """Change password after verifying old one."""
    creds = _load()

    if not pwd_context.verify(old_password, creds["password_hash"]):
        return {"success": False, "error": "Ancien mot de passe incorrect"}

    if len(new_password) < 4:
        return {"success": False, "error": "Le nouveau mot de passe doit faire au moins 4 caractères"}

    if old_password == new_password:
        return {"success": False, "error": "Le nouveau mot de passe doit être différent de l'ancien"}

    creds["password_hash"] = pwd_context.hash(new_password)
    creds["password_changed_at"] = datetime.now(timezone.utc).isoformat()
    _save(creds)

    return {"success": True}
