"""
Digital Humans router (A6.3) — exposes platform-specific monitoring data.

Endpoints :
  GET /api/dh/workers          — état des workers ARQ
  GET /api/dh/executions/active — exécutions en cours
  GET /api/dh/budget           — consommation crédits temps réel
  GET /api/dh/agents/health    — santé des 11 agents

Implémentation pragmatique : pour l'instant, requête PostgreSQL côté DH
+ ping Redis pour ARQ. Si les requêtes échouent, on retourne des valeurs
neutres pour ne pas faire planter l'UI (qui gère les nulls).
"""
import os
from fastapi import APIRouter, Depends
from routers.auth import get_current_user

router = APIRouter(prefix="/api/dh", tags=["digital-humans"])

DH_DB_URL = os.getenv(
    "DH_DB_URL",
    "postgresql://digital_humans:DH_SecurePass2025!@127.0.0.1:5432/digital_humans_db",
)
REDIS_URL = os.getenv("DH_REDIS_URL", "redis://127.0.0.1:6379")


def _query_one(sql: str, params: tuple = ()):
    """Run a single SQL query and return first row as dict, or None on error."""
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        with psycopg2.connect(DH_DB_URL) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, params)
                row = cur.fetchone()
                return dict(row) if row else None
    except Exception as e:
        print(f"[dh router] query error: {e}")
        return None


def _query_all(sql: str, params: tuple = ()):
    """Run a SQL query and return all rows as list of dicts, or [] on error."""
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        with psycopg2.connect(DH_DB_URL) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, params)
                return [dict(r) for r in cur.fetchall()]
    except Exception as e:
        print(f"[dh router] query error: {e}")
        return []


@router.get("/workers")
async def workers_status(user: str = Depends(get_current_user)):
    """État des workers ARQ — détecté via Redis."""
    try:
        import redis
        r = redis.from_url(REDIS_URL, decode_responses=True, socket_timeout=2)
        # ARQ stocke les workers actifs sous arq:health-check:*
        worker_keys = r.keys("arq:health-check:*") or []
        # Si on a une clé arq:queue ou similaire, on peut regarder si le worker tourne
        all_keys = r.keys("arq:*") or []
        count = len(worker_keys)
        return {
            "count": count,
            "healthy": count > 0,
            "redis_keys_total": len(all_keys),
        }
    except Exception as e:
        return {"count": None, "healthy": None, "error": str(e)}


@router.get("/executions/active")
async def executions_active(user: str = Depends(get_current_user)):
    """Exécutions en cours sur la plateforme DH."""
    rows = _query_all(
        """
        SELECT id, project_id, status, started_at, current_state
        FROM executions
        WHERE status IN ('running', 'in_progress', 'pending')
           OR current_state NOT IN ('COMPLETED', 'FAILED', 'CANCELLED', 'INITIAL')
        ORDER BY started_at DESC
        LIMIT 10
        """
    )
    last_started = None
    if rows and rows[0].get("started_at"):
        try:
            last_started = rows[0]["started_at"].isoformat()
        except Exception:
            last_started = str(rows[0]["started_at"])
    return {
        "count": len(rows),
        "executions": [
            {
                "id": r.get("id"),
                "project_id": r.get("project_id"),
                "status": r.get("status"),
                "current_state": r.get("current_state"),
            }
            for r in rows
        ],
        "last_started": last_started,
    }


@router.get("/budget")
async def budget_used(user: str = Depends(get_current_user)):
    """Consommation crédits récente — somme des transactions du jour."""
    today_row = _query_one(
        """
        SELECT COALESCE(SUM(ABS(amount)), 0) AS used
        FROM credit_transactions
        WHERE created_at >= CURRENT_DATE
          AND amount < 0
        """
    )
    month_row = _query_one(
        """
        SELECT COALESCE(SUM(ABS(amount)), 0) AS used_month
        FROM credit_transactions
        WHERE created_at >= date_trunc('month', CURRENT_DATE)
          AND amount < 0
        """
    )
    return {
        "used": int(today_row.get("used", 0)) if today_row else None,
        "used_month": int(month_row.get("used_month", 0)) if month_row else None,
        "window": "today",
    }


@router.get("/agents/health")
async def agents_health(user: str = Depends(get_current_user)):
    """Santé des agents — basée sur les exécutions récentes (dernière heure)."""
    rows = _query_all(
        """
        SELECT agent_id, agent_name, status, COUNT(*) AS count
        FROM execution_agents
        WHERE updated_at >= NOW() - INTERVAL '1 hour'
        GROUP BY agent_id, agent_name, status
        """
    )

    # Constants : les 11 agents de l'ensemble Studio
    KNOWN_AGENTS = [
        "sophie", "olivia", "emma", "marcus",
        "diego", "zara", "raj",
        "elena", "jordan",
        "aisha", "lucas",
    ]

    # Aggrégat par agent_id
    by_agent = {}
    for r in rows:
        aid = (r.get("agent_id") or "").lower()
        if aid not in by_agent:
            by_agent[aid] = {"runs": 0, "errors": 0}
        by_agent[aid]["runs"] += r.get("count", 0)
        if r.get("status") in ("failed", "error"):
            by_agent[aid]["errors"] += r.get("count", 0)

    healthy_count = 0
    breakdown = []
    for aid in KNOWN_AGENTS:
        stats = by_agent.get(aid, {"runs": 0, "errors": 0})
        is_healthy = stats["errors"] == 0  # No errors in last hour = healthy
        if is_healthy:
            healthy_count += 1
        breakdown.append({
            "agent_id": aid,
            "runs_last_hour": stats["runs"],
            "errors_last_hour": stats["errors"],
            "healthy": is_healthy,
        })

    return {
        "total_count": len(KNOWN_AGENTS),
        "healthy_count": healthy_count,
        "breakdown": breakdown,
    }
