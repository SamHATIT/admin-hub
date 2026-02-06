"""
Ollama service - Integration with Ollama LLM API.
Provides: list_models()
"""
import requests
import logging
from config import settings

logger = logging.getLogger("admin-hub.ollama")


def list_models() -> dict:
    """List all installed Ollama models via API."""
    try:
        resp = requests.get(
            f"{settings.OLLAMA_URL}/api/tags",
            timeout=5,
        )
        resp.raise_for_status()
        data = resp.json()

        models = []
        for m in data.get("models", []):
            size_gb = round(m.get("size", 0) / (1024**3), 1)
            models.append({
                "name": m.get("name", "unknown"),
                "model": m.get("model", ""),
                "size_bytes": m.get("size", 0),
                "size_display": f"{size_gb} GB",
                "modified_at": m.get("modified_at"),
                "digest": m.get("digest", "")[:12],
            })

        return {"success": True, "models": models, "total": len(models)}
    except requests.ConnectionError:
        return {"success": False, "error": "Ollama is not running", "models": [], "total": 0}
    except Exception as e:
        logger.error(f"Ollama list_models error: {e}")
        return {"success": False, "error": str(e), "models": [], "total": 0}
