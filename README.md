# Hub d'Administration Digital Humans

Interface web centralisée pour monitorer et administrer tous les services de l'infrastructure Digital Humans.

## 🎯 Objectif

Avoir une visibilité complète et un contrôle centralisé sur :
- Digital Humans (Backend + Frontend)
- N8N Workflows
- Ollama (LLMs)
- Ghost CMS
- PostgreSQL
- Nginx
- RAG ChromaDB

## 🏗️ Architecture

- **Backend:** FastAPI (port 3100)
- **Frontend:** React + Vite
- **Serveur:** 72.61.161.222 (Ubuntu 24.04)
- **URL:** https://digital-humans.fr/admin

## 📁 Structure

```
admin-hub/
├── backend/          # API FastAPI
├── frontend/         # Interface React
├── nginx/            # Config reverse proxy
└── docs/             # Documentation
```

## 🚀 Installation

Voir WORKFLOW_DEVELOPPEMENT.md pour le workflow complet.

## 📝 Documentation

- `PITCH_ET_WBS_HUB_ADMINISTRATION.md` - Spécifications complètes
- `WORKFLOW_DEVELOPPEMENT.md` - Workflow de développement
- Guide Admin v1 & v2 - Commandes système

## 👤 Auteur

Sam Hatit - Sam Hatit Consulting
