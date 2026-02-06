"""
Integrations router - N8N, Ollama, Ghost, RAG endpoints.
Phase P2 - Developed by Claude Web on VPS.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from routers.auth import get_current_user
from services.n8n_service import get_workflows, get_workflow_executions, toggle_workflow
from services.ollama_service import list_models, list_running, unload_model, delete_model, pull_model, get_server_memory
from services.ghost_service import get_stats as ghost_stats
from services.rag_service import check_health as rag_health
from services.system_service import log_action

router = APIRouter(prefix="/api", tags=["integrations"])


# === N8N ===

@router.get("/n8n/workflows")
async def n8n_workflows(user: str = Depends(get_current_user)):
    """List all N8N workflows with their status."""
    return get_workflows()


@router.get("/n8n/executions")
async def n8n_executions(
    workflow_id: str = None,
    limit: int = 10,
    user: str = Depends(get_current_user),
):
    """Get recent N8N workflow executions."""
    return get_workflow_executions(workflow_id=workflow_id, limit=limit)


class ToggleRequest(BaseModel):
    activate: bool


@router.post("/n8n/workflow/{workflow_id}/toggle")
async def n8n_toggle_workflow(
    workflow_id: str,
    request: ToggleRequest,
    user: str = Depends(get_current_user),
):
    """Activate or deactivate a N8N workflow."""
    result = toggle_workflow(workflow_id, request.activate)
    action = "activate" if request.activate else "deactivate"
    log_action(f"n8n_workflow_{workflow_id}", action, result, user=user)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))
    return result


# === OLLAMA ===

@router.get("/ollama/models")
async def ollama_models(user: str = Depends(get_current_user)):
    """List all installed Ollama models."""
    return list_models()


@router.get("/ollama/running")
async def ollama_running(user: str = Depends(get_current_user)):
    """List models currently loaded in RAM."""
    return list_running()


@router.get("/ollama/memory")
async def ollama_memory(user: str = Depends(get_current_user)):
    """Get server RAM usage."""
    return get_server_memory()


class OllamaModelRequest(BaseModel):
    model: str


@router.post("/ollama/unload")
async def ollama_unload(request: OllamaModelRequest, user: str = Depends(get_current_user)):
    """Unload a model from RAM."""
    result = unload_model(request.model)
    log_action("ollama", f"unload_{request.model}", result, user=user)
    return result


@router.post("/ollama/delete")
async def ollama_delete(request: OllamaModelRequest, user: str = Depends(get_current_user)):
    """Delete a model from disk."""
    result = delete_model(request.model)
    log_action("ollama", f"delete_{request.model}", result, user=user)
    return result


@router.post("/ollama/pull")
async def ollama_pull(request: OllamaModelRequest, user: str = Depends(get_current_user)):
    """Download a new model."""
    result = pull_model(request.model)
    log_action("ollama", f"pull_{request.model}", result, user=user)
    return result


# === GHOST ===

@router.get("/ghost/stats")
async def ghost_statistics(user: str = Depends(get_current_user)):
    """Get Ghost CMS stats (published, drafts, latest post)."""
    return ghost_stats()


# === RAG ===

@router.get("/rag/health")
async def rag_health_check(user: str = Depends(get_current_user)):
    """Check RAG ChromaDB health (chunks, size, integrity)."""
    return rag_health()
