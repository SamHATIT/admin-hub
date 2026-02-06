"""
Configuration centralisée - Admin Hub
Toutes les valeurs sensibles doivent venir de variables d'environnement.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # App
    APP_PORT: int = int(os.getenv("APP_PORT", "3100"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:5173",       # Vite dev server
        "http://localhost:3000",       # Alternative dev
        "https://digital-humans.fr",   # Production
    ]

    # Services - Ports monitored on VPS
    BACKEND_PORT: int = 8002
    FRONTEND_PORT: int = 3000
    N8N_PORT: int = 5678
    OLLAMA_PORT: int = 11434
    GHOST_PORT: int = 2368
    POSTGRES_PORT: int = 5432
    NGINX_HTTP_PORT: int = 80
    NGINX_HTTPS_PORT: int = 443

    # External URLs
    N8N_URL: str = os.getenv("N8N_URL", "https://n8n.samhatit-consulting.cloud")
    OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
    GHOST_URL: str = os.getenv("GHOST_URL", "https://blog-admin.digital-humans.fr")

    # RAG ChromaDB
    CHROMA_DB_PATH: str = os.getenv(
        "CHROMA_DB_PATH",
        "/opt/digital-humans/rag/chromadb_data/chroma.sqlite3",
    )

    # Logs
    ACTIONS_LOG: str = os.getenv("ACTIONS_LOG", "/var/log/admin-hub-actions.log")


settings = Settings()
