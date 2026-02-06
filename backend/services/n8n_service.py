"""
N8N service - Integration with N8N Workflows API.
Provides: get_workflows(), get_workflow_executions(), toggle_workflow()
"""
import requests
import logging
from config import settings

logger = logging.getLogger("admin-hub.n8n")

def _headers():
    return {"X-N8N-API-KEY": settings.N8N_API_KEY}

def _base_url():
    return settings.N8N_INTERNAL_URL


def get_workflows() -> dict:
    """Get all workflows with their status."""
    try:
        resp = requests.get(
            f"{_base_url()}/api/v1/workflows",
            headers=_headers(),
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()

        workflows = []
        for w in data.get("data", []):
            workflows.append({
                "id": w["id"],
                "name": w["name"],
                "active": w.get("active", False),
                "created_at": w.get("createdAt"),
                "updated_at": w.get("updatedAt"),
            })

        return {
            "success": True,
            "workflows": workflows,
            "total": len(workflows),
        }
    except requests.ConnectionError:
        return {"success": False, "error": "N8N is not running", "workflows": [], "total": 0}
    except Exception as e:
        logger.error(f"N8N get_workflows error: {e}")
        return {"success": False, "error": str(e), "workflows": [], "total": 0}


def get_workflow_executions(workflow_id: str = None, limit: int = 10) -> dict:
    """Get recent executions, optionally filtered by workflow."""
    try:
        # Build workflow name lookup
        wf_names = {}
        try:
            wf_resp = requests.get(f"{_base_url()}/api/v1/workflows", headers=_headers(), timeout=5)
            if wf_resp.ok:
                for w in wf_resp.json().get("data", []):
                    wf_names[w["id"]] = w["name"]
        except Exception:
            pass

        params = {"limit": limit}
        if workflow_id:
            params["workflowId"] = workflow_id

        resp = requests.get(
            f"{_base_url()}/api/v1/executions",
            headers=_headers(),
            params=params,
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()

        executions = []
        for e in data.get("data", []):
            wf_id = e.get("workflowId", "")
            executions.append({
                "id": e["id"],
                "workflow_id": wf_id,
                "workflow_name": wf_names.get(wf_id, "Unknown"),
                "status": e.get("status", "unknown"),
                "started_at": e.get("startedAt"),
                "finished_at": e.get("stoppedAt"),
            })

        return {"success": True, "executions": executions, "total": len(executions)}
    except requests.ConnectionError:
        return {"success": False, "error": "N8N is not running", "executions": [], "total": 0}
    except Exception as e:
        logger.error(f"N8N get_executions error: {e}")
        return {"success": False, "error": str(e), "executions": [], "total": 0}


def toggle_workflow(workflow_id: str, activate: bool) -> dict:
    """Activate or deactivate a workflow."""
    try:
        action = "activate" if activate else "deactivate"
        resp = requests.post(
            f"{_base_url()}/api/v1/workflows/{workflow_id}/{action}",
            headers=_headers(),
            timeout=10,
        )
        resp.raise_for_status()
        return {"success": True, "action": action, "workflow_id": workflow_id}
    except requests.ConnectionError:
        return {"success": False, "error": "N8N is not running"}
    except Exception as e:
        logger.error(f"N8N toggle_workflow error: {e}")
        return {"success": False, "error": str(e)}
