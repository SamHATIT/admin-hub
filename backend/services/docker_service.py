"""
Docker monitoring and management service.
Uses docker CLI for reliability (no extra Python deps).
"""
import asyncio
import json


async def _run(cmd: str) -> str:
    proc = await asyncio.create_subprocess_shell(
        cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=15)
    return stdout.decode(errors="replace").strip()


async def list_containers(all: bool = True) -> list[dict]:
    """List Docker containers with status and ports."""
    fmt = '{"name":"{{.Names}}","image":"{{.Image}}","status":"{{.Status}}","state":"{{.State}}","ports":"{{.Ports}}","id":"{{.ID}}"}'
    flag = "-a" if all else ""
    raw = await _run(f'docker ps {flag} --format \'{fmt}\'')
    if not raw:
        return []
    
    containers = []
    for line in raw.splitlines():
        try:
            c = json.loads(line)
            # Clean up ports display
            c["ports_display"] = _simplify_ports(c.get("ports", ""))
            containers.append(c)
        except json.JSONDecodeError:
            continue
    return containers


async def get_stats() -> list[dict]:
    """Get CPU/RAM stats for running containers."""
    fmt = '{"name":"{{.Name}}","cpu":"{{.CPUPerc}}","mem_usage":"{{.MemUsage}}","mem_pct":"{{.MemPerc}}"}'
    raw = await _run(f"docker stats --no-stream --format '{fmt}'")
    if not raw:
        return []
    
    stats = []
    for line in raw.splitlines():
        try:
            stats.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return stats


async def get_containers_with_stats() -> list[dict]:
    """Combined view: containers + their resource usage."""
    containers, stats = await asyncio.gather(
        list_containers(all=True),
        get_stats()
    )
    
    stats_map = {s["name"]: s for s in stats}
    
    for c in containers:
        s = stats_map.get(c["name"], {})
        c["cpu"] = s.get("cpu", "-")
        c["mem_usage"] = s.get("mem_usage", "-")
        c["mem_pct"] = s.get("mem_pct", "-")
    
    return containers


async def container_action(name: str, action: str) -> dict:
    """Start/stop/restart a container."""
    allowed = {"start", "stop", "restart"}
    if action not in allowed:
        return {"success": False, "error": f"Action must be one of {allowed}"}
    
    try:
        proc = await asyncio.create_subprocess_shell(
            f"docker {action} {name}",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=30)
        return {
            "success": proc.returncode == 0,
            "stdout": stdout.decode(errors="replace").strip(),
            "stderr": stderr.decode(errors="replace").strip(),
            "return_code": proc.returncode,
        }
    except asyncio.TimeoutError:
        return {"success": False, "error": "Timeout after 30s"}


def _simplify_ports(ports_str: str) -> str:
    """Simplify Docker ports display."""
    if not ports_str:
        return "-"
    # Extract unique host:container pairs
    parts = []
    for segment in ports_str.split(", "):
        if "->" in segment:
            # "0.0.0.0:3200->8080/tcp" → "3200→8080"
            left, right = segment.split("->")
            host_port = left.split(":")[-1]
            container_port = right.split("/")[0]
            pair = f"{host_port}→{container_port}"
            if pair not in parts:
                parts.append(pair)
    return ", ".join(parts) if parts else ports_str
