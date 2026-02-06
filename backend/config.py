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

    # Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "admin-hub-secret-change-me-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("TOKEN_EXPIRE_MINUTES", "480"))
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "sam")
    # Default password hash for "admin" - MUST be changed via env var in production
    ADMIN_PASSWORD_HASH: str = os.getenv(
        "ADMIN_PASSWORD_HASH",
        "$2b$12$4y9qWSlboigfBdWNdY4Ciu4T4uR/NzqA8NTIzg0ot1TAVSI/9THwS",
    )

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

    # Service definitions: name -> {port, check_type, commands, link}
    SERVICES: dict = {
        "backend": {
            "label": "Digital Humans Backend",
            "port": 8002,
            "check_type": "http",
            "check_url": "http://localhost:8002/docs",
            "commands": {
                "start": "cd /opt/digital-humans/backend && nohup uvicorn app.main:app --host 0.0.0.0 --port 8002 > /tmp/backend.log 2>&1 &",
                "stop": "fuser -k 8002/tcp",
                "restart": "fuser -k 8002/tcp; sleep 2; cd /opt/digital-humans/backend && nohup uvicorn app.main:app --host 0.0.0.0 --port 8002 > /tmp/backend.log 2>&1 &",
            },
            "log_file": "/tmp/backend.log",
            "link": "http://72.61.161.222:8002/docs",
        },
        "frontend": {
            "label": "Digital Humans Frontend",
            "port": 3000,
            "check_type": "http",
            "check_url": "http://localhost:3000",
            "commands": {
                "start": "cd /opt/digital-humans/frontend && nohup npx vite --host 0.0.0.0 --port 3000 > /tmp/frontend.log 2>&1 &",
                "stop": "fuser -k 3000/tcp",
                "restart": "fuser -k 3000/tcp; sleep 2; cd /opt/digital-humans/frontend && nohup npx vite --host 0.0.0.0 --port 3000 > /tmp/frontend.log 2>&1 &",
            },
            "log_file": "/tmp/frontend.log",
            "link": "http://72.61.161.222",
        },
        "n8n": {
            "label": "N8N Workflows",
            "port": 5678,
            "check_type": "http",
            "check_url": "http://localhost:5678",
            "commands": {
                "start": "cd /root && nohup n8n start > /tmp/n8n.log 2>&1 &",
                "stop": "fuser -k 5678/tcp",
            },
            "log_file": "/tmp/n8n.log",
            "link": "https://n8n.samhatit-consulting.cloud",
        },
        "ollama": {
            "label": "Ollama LLM",
            "port": 11434,
            "check_type": "http",
            "check_url": "http://localhost:11434/api/tags",
            "commands": {
                "start": "nohup ollama serve > /var/log/ollama.log 2>&1 &",
                "stop": "pkill -f 'ollama serve'",
            },
            "log_file": "/var/log/ollama.log",
            "link": None,
        },
        "ghost": {
            "label": "Ghost CMS",
            "port": 2368,
            "check_type": "docker",
            "docker_container": "ghost-blog",
            "commands": {
                "restart": "docker restart ghost-blog",
            },
            "log_file": None,
            "link": "https://blog-admin.digital-humans.fr/ghost",
        },
        "postgresql": {
            "label": "PostgreSQL",
            "port": 5432,
            "check_type": "systemctl",
            "systemd_service": "postgresql",
            "commands": {
                "restart": "sudo systemctl restart postgresql",
            },
            "log_file": None,
            "link": None,
        },
        "nginx": {
            "label": "Nginx",
            "port": 80,
            "check_type": "systemctl",
            "systemd_service": "nginx",
            "commands": {
                "restart": "sudo systemctl restart nginx",
                "test_config": "sudo nginx -t",
            },
            "log_file": None,
            "link": None,
        },
    }


settings = Settings()
