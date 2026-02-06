"""
System service - Core service management.
Provides: check_port(), execute_command(), get_logs(), get_service_status()
"""
import asyncio
import socket
import time
import logging
from datetime import datetime, timezone

import requests
from config import settings

logger = logging.getLogger("admin-hub")

# Allowed commands whitelist: only commands defined in config.SERVICES are permitted
_ALLOWED_COMMANDS: set[str] = set()
for _svc in settings.SERVICES.values():
    for _cmd in _svc.get("commands", {}).values():
        _ALLOWED_COMMANDS.add(_cmd)


def check_port(port: int, host: str = "localhost", timeout: float = 2.0) -> bool:
    """Check if a TCP port is open."""
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (OSError, ConnectionRefusedError):
        return False


def check_http(url: str, timeout: float = 5.0) -> dict:
    """Check an HTTP endpoint. Returns status and response time."""
    try:
        start = time.monotonic()
        resp = requests.get(url, timeout=timeout, allow_redirects=True)
        elapsed_ms = round((time.monotonic() - start) * 1000)
        return {
            "up": resp.status_code < 500,
            "response_time_ms": elapsed_ms,
            "status_code": resp.status_code,
        }
    except requests.RequestException:
        return {"up": False, "response_time_ms": None, "status_code": None}


async def execute_command(command: str, timeout: float = 60.0) -> dict:
    """
    Execute a shell command asynchronously.
    Only allows commands registered in the service config whitelist.
    Returns stdout, stderr, and return code.
    """
    if command not in _ALLOWED_COMMANDS:
        return {
            "success": False,
            "stdout": "",
            "stderr": "Command not in whitelist",
            "return_code": -1,
        }

    try:
        proc = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        return {
            "success": proc.returncode == 0,
            "stdout": stdout.decode(errors="replace").strip(),
            "stderr": stderr.decode(errors="replace").strip(),
            "return_code": proc.returncode,
        }
    except asyncio.TimeoutError:
        proc.kill()
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Command timed out after {timeout}s",
            "return_code": -1,
        }
    except Exception as e:
        return {
            "success": False,
            "stdout": "",
            "stderr": str(e),
            "return_code": -1,
        }


def get_logs(filepath: str, lines: int = 100) -> dict:
    """Read the last N lines of a log file."""
    if filepath is None:
        return {"success": False, "lines": [], "error": "No log file configured"}

    try:
        with open(filepath, "r", errors="replace") as f:
            all_lines = f.readlines()
            tail = all_lines[-lines:]
        return {
            "success": True,
            "lines": [line.rstrip("\n") for line in tail],
            "total_lines": len(all_lines),
        }
    except FileNotFoundError:
        return {"success": False, "lines": [], "error": f"File not found: {filepath}"}
    except PermissionError:
        return {"success": False, "lines": [], "error": f"Permission denied: {filepath}"}


def _check_systemctl(service_name: str) -> bool:
    """Check if a systemd service is active."""
    import subprocess
    try:
        result = subprocess.run(
            ["systemctl", "is-active", service_name],
            capture_output=True, text=True, timeout=5,
        )
        return result.stdout.strip() == "active"
    except Exception:
        return False


def _check_docker(container_name: str) -> bool:
    """Check if a Docker container is running."""
    import subprocess
    try:
        result = subprocess.run(
            ["docker", "inspect", "-f", "{{.State.Running}}", container_name],
            capture_output=True, text=True, timeout=5,
        )
        return result.stdout.strip() == "true"
    except Exception:
        return False


def get_service_status(service_name: str) -> dict:
    """Get the full status of a single service."""
    svc_config = settings.SERVICES.get(service_name)
    if not svc_config:
        return {"error": f"Unknown service: {service_name}"}

    check_type = svc_config.get("check_type", "http")
    result = {
        "name": service_name,
        "label": svc_config["label"],
        "port": svc_config.get("port"),
        "status": "unknown",
        "response_time_ms": None,
        "actions": list(svc_config.get("commands", {}).keys()),
        "link": svc_config.get("link"),
        "has_logs": svc_config.get("log_file") is not None,
    }

    if check_type == "http":
        http_result = check_http(svc_config["check_url"])
        result["status"] = "up" if http_result["up"] else "down"
        result["response_time_ms"] = http_result["response_time_ms"]
    elif check_type == "systemctl":
        is_active = _check_systemctl(svc_config["systemd_service"])
        result["status"] = "up" if is_active else "down"
    elif check_type == "docker":
        is_running = _check_docker(svc_config["docker_container"])
        result["status"] = "up" if is_running else "down"
    else:
        is_open = check_port(svc_config.get("port", 0))
        result["status"] = "up" if is_open else "down"

    return result


def get_all_services_status() -> dict:
    """Get status of all configured services."""
    statuses = {}
    for name in settings.SERVICES:
        statuses[name] = get_service_status(name)
    statuses["_meta"] = {
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "total_services": len(settings.SERVICES),
    }
    return statuses


def log_action(service: str, action: str, result: dict, user: str = "unknown"):
    """Append an action to the admin hub actions log."""
    timestamp = datetime.now(timezone.utc).isoformat()
    line = f"[{timestamp}] user={user} service={service} action={action} success={result.get('success', 'N/A')}\n"
    try:
        with open(settings.ACTIONS_LOG, "a") as f:
            f.write(line)
    except Exception as e:
        logger.warning(f"Failed to write action log: {e}")
