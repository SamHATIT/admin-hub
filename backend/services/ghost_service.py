"""
Ghost CMS service - Stats via direct SQLite access to Ghost DB.
Provides: get_stats()
"""
import sqlite3
import logging
from config import settings

logger = logging.getLogger("admin-hub.ghost")


def get_stats() -> dict:
    """Get Ghost CMS stats: published, drafts, latest post."""
    db_path = settings.GHOST_DB_PATH
    try:
        conn = sqlite3.connect(db_path, timeout=5)
        cursor = conn.cursor()

        # Count by status
        cursor.execute("SELECT status, COUNT(*) FROM posts WHERE type='post' GROUP BY status")
        counts = dict(cursor.fetchall())

        # Latest published post
        cursor.execute(
            "SELECT title, published_at FROM posts "
            "WHERE status='published' AND type='post' "
            "ORDER BY published_at DESC LIMIT 1"
        )
        latest = cursor.fetchone()

        conn.close()

        return {
            "success": True,
            "published": counts.get("published", 0),
            "drafts": counts.get("draft", 0),
            "latest_post": {
                "title": latest[0] if latest else None,
                "published_at": latest[1] if latest else None,
            },
            "admin_url": "https://blog-admin.digital-humans.fr/ghost",
        }
    except FileNotFoundError:
        return {"success": False, "error": f"Ghost DB not found: {db_path}"}
    except Exception as e:
        logger.error(f"Ghost get_stats error: {e}")
        return {"success": False, "error": str(e)}
