"""
Hub d'Administration Digital Humans - Backend FastAPI
Port: 3100
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers.auth import router as auth_router
from routers.services import router as services_router
from routers.integrations import router as integrations_router
from routers.docker_router import router as docker_router
from routers.dh import router as dh_router

app = FastAPI(
    title="Admin Hub - Digital Humans",
    description="API centralisée de monitoring et contrôle des services",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS - allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(services_router)
app.include_router(integrations_router)
app.include_router(docker_router)
app.include_router(dh_router)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "admin-hub"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=settings.APP_PORT, reload=True)
