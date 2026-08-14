from fastapi import Depends, HTTPException, status

from app.dependencies.auth import get_current_user
from app.models.user import User


def require_roles(*allowed_roles: str):
    """Returns a FastAPI dependency that only lets the given roles through."""

    allowed = {role.lower() for role in allowed_roles}

    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.lower() not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return current_user

    return checker
