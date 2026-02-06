"""
Services router - Status monitoring and action execution.
"""
from fastapi import APIRouter, Depends, HTTPException

from routers.auth import get_current_user
from models.schemas import ServiceActionRequest
from services.system_service import (
    get_all_services_status,
    get_service_status,
    execute_command,
    get_logs,
    log_action,
)
from config import settings

router = APIRouter(prefix="/api/services", tags=["services"])


@router.get("/status")
async def all_services_status(user: str = Depends(get_current_user)):
    """Return status of all 7 monitored services."""
    return get_all_services_status()


@router.get("/status/{service_name}")
async def single_service_status(service_name: str, user: str = Depends(get_current_user)):
    """Return status of a single service."""
    if service_name not in settings.SERVICES:
        raise HTTPException(status_code=404, detail=f"Unknown service: {service_name}")
    return get_service_status(service_name)


@router.post("/action")
async def service_action(request: ServiceActionRequest, user: str = Depends(get_current_user)):
    """Execute an action (start/stop/restart/logs/test_config) on a service."""
    svc_config = settings.SERVICES.get(request.service)
    if not svc_config:
        raise HTTPException(status_code=404, detail=f"Unknown service: {request.service}")

    # Handle logs action separately
    if request.action == "logs":
        log_file = svc_config.get("log_file")
        result = get_logs(log_file)
        log_action(request.service, "logs", result, user=user)
        return result

    # Check if action is available for this service
    commands = svc_config.get("commands", {})
    if request.action not in commands:
        available = list(commands.keys()) + (["logs"] if svc_config.get("log_file") else [])
        raise HTTPException(
            status_code=400,
            detail=f"Action '{request.action}' not available for '{request.service}'. Available: {available}",
        )

    command = commands[request.action]
    result = await execute_command(command)
    log_action(request.service, request.action, result, user=user)

    return {
        "service": request.service,
        "action": request.action,
        "result": result,
    }
