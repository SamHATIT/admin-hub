"""
Ollama service - Full management: list, loaded models, pull, delete, unload.
"""
import requests
import subprocess
import logging
from config import settings

logger = logging.getLogger("admin-hub.ollama")
OLLAMA_URL = settings.OLLAMA_URL


def list_models() -> dict:
    """List all downloaded Ollama models."""
    try:
        resp = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
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


def list_running() -> dict:
    """List models currently loaded in RAM (ollama ps)."""
    try:
        resp = requests.get(f"{OLLAMA_URL}/api/ps", timeout=5)
        resp.raise_for_status()
        data = resp.json()

        loaded = []
        total_vram = 0
        for m in data.get("models", []):
            size = m.get("size", 0)
            size_gb = round(size / (1024**3), 1)
            total_vram += size
            loaded.append({
                "name": m.get("name", "unknown"),
                "model": m.get("model", ""),
                "size_bytes": size,
                "size_display": f"{size_gb} GB",
                "size_vram": m.get("size_vram", 0),
                "processor": m.get("processor", "cpu"),
                "expires_at": m.get("expires_at"),
            })

        return {
            "success": True,
            "loaded": loaded,
            "total_loaded": len(loaded),
            "total_vram_bytes": total_vram,
            "total_vram_display": f"{round(total_vram / (1024**3), 1)} GB",
        }
    except requests.ConnectionError:
        return {"success": False, "error": "Ollama is not running", "loaded": [], "total_loaded": 0}
    except Exception as e:
        logger.error(f"Ollama list_running error: {e}")
        return {"success": False, "error": str(e), "loaded": [], "total_loaded": 0}


def unload_model(model_name: str) -> dict:
    """Unload a model from RAM by setting keep_alive to 0."""
    try:
        resp = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": model_name, "prompt": "", "keep_alive": 0},
            timeout=10,
        )
        return {"success": resp.status_code == 200, "message": f"{model_name} déchargé de la mémoire"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def delete_model(model_name: str) -> dict:
    """Delete a model from disk."""
    try:
        resp = requests.delete(
            f"{OLLAMA_URL}/api/delete",
            json={"name": model_name},
            timeout=15,
        )
        if resp.status_code == 200:
            return {"success": True, "message": f"{model_name} supprimé du disque"}
        else:
            return {"success": False, "error": resp.text}
    except Exception as e:
        return {"success": False, "error": str(e)}


def pull_model(model_name: str) -> dict:
    """Start pulling a model. Returns immediately (pull is async in Ollama)."""
    try:
        # Use stream=False for a synchronous check, but this can take long
        # Better: start the pull and return status
        resp = requests.post(
            f"{OLLAMA_URL}/api/pull",
            json={"name": model_name, "stream": False},
            timeout=300,  # 5 min max for small models
        )
        if resp.status_code == 200:
            return {"success": True, "message": f"{model_name} téléchargé avec succès"}
        else:
            return {"success": False, "error": resp.text}
    except requests.Timeout:
        return {"success": False, "error": "Téléchargement trop long (>5min). Vérifiez avec 'ollama list'."}
    except Exception as e:
        return {"success": False, "error": str(e)}


def get_server_memory() -> dict:
    """Get server RAM usage."""
    try:
        result = subprocess.run(
            ["free", "-b"], capture_output=True, text=True, timeout=5
        )
        lines = result.stdout.strip().split("\n")
        parts = lines[1].split()
        total = int(parts[1])
        used = int(parts[2])
        available = int(parts[6])
        return {
            "total_bytes": total,
            "used_bytes": used,
            "available_bytes": available,
            "total_display": f"{round(total / (1024**3), 1)} GB",
            "used_display": f"{round(used / (1024**3), 1)} GB",
            "available_display": f"{round(available / (1024**3), 1)} GB",
            "usage_pct": round(used / total * 100, 1),
        }
    except Exception as e:
        return {"error": str(e)}
