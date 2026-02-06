"""
RAG ChromaDB service - Health check for the vector database.
Provides: check_health()
"""
import os
import sqlite3
import logging
from config import settings

logger = logging.getLogger("admin-hub.rag")


def check_health(full_check: bool = False) -> dict:
    """
    Check RAG ChromaDB health: chunk count, db size.
    full_check=True also runs PRAGMA integrity_check (slow on 2.4GB DB).
    """
    db_path = settings.CHROMA_DB_PATH
    db_dir = os.path.dirname(db_path)

    result = {
        "success": True,
        "db_path": db_path,
        "chunks": 0,
        "expected_chunks": 70251,
        "db_size_bytes": 0,
        "db_size_display": "",
        "dir_size_display": "",
        "healthy": False,
    }

    # Check file exists
    if not os.path.exists(db_path):
        result["success"] = False
        result["error"] = f"ChromaDB file not found: {db_path}"
        return result

    try:
        # File size
        result["db_size_bytes"] = os.path.getsize(db_path)
        result["db_size_display"] = f"{result['db_size_bytes'] / (1024**3):.1f} GB"

        # Directory total size
        total_size = 0
        for dirpath, dirnames, filenames in os.walk(db_dir):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                try:
                    total_size += os.path.getsize(fp)
                except OSError:
                    pass
        result["dir_size_display"] = f"{total_size / (1024**3):.1f} GB"

        # Count embeddings
        conn = sqlite3.connect(db_path, timeout=10)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM embeddings")
        result["chunks"] = cursor.fetchone()[0]

        # Integrity check only if requested (very slow on 2.4GB)
        if full_check:
            cursor.execute("PRAGMA integrity_check")
            result["integrity"] = cursor.fetchone()[0]

        conn.close()

        # Healthy if chunks match expected
        result["healthy"] = result["chunks"] >= result["expected_chunks"]

        return result
    except Exception as e:
        logger.error(f"RAG check_health error: {e}")
        result["success"] = False
        result["error"] = str(e)
        return result
