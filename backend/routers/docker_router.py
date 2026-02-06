"""
Docker monitoring and management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from routers.auth import get_current_user
from services.docker_service import get_containers_with_stats, container_action

router = APIRouter(prefix="/api/docker", tags=["docker"])


class DockerActionRequest(BaseModel):
    container: str
    action: str  # start, stop, restart


@router.get("/containers")
async def get_containers(user: str = Depends(get_current_user)):
    """List all containers with stats."""
    containers = await get_containers_with_stats()
    return {"containers": containers, "total": len(containers)}


@router.post("/action")
async def docker_action(
    request: DockerActionRequest,
    user: str = Depends(get_current_user),
):
    """Start/stop/restart a container."""
    result = await container_action(request.container, request.action)
    
    # Log action
    import logging
    logger = logging.getLogger("admin-hub.actions")
    logger.info(f"Docker {request.action} {request.container} by {user}: {'OK' if result['success'] else 'FAIL'}")
    
    return {"container": request.container, "action": request.action, "result": result}
