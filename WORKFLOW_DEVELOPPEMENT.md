# 🔄 WORKFLOW DE DÉVELOPPEMENT - Hub Administration

**Date :** 6 février 2026  
**Organisation :** Claude Code (développement) + Claude Web (validation/intégration)  
**Infrastructure :** VPS 72.61.161.222 + GitHub

---

## 🎯 PRINCIPES FONDAMENTAUX

### Pourquoi cette approche hybride ?

1. **Claude Code** est plus rapide et efficace pour le développement pur
2. **Claude Web** a accès au VPS via MCP pour tester en conditions réelles
3. **GitHub** sert de point de synchronisation entre les deux
4. **Validation systématique** : chaque phase doit être approuvée avant de passer à la suivante

### Règle d'or
**JAMAIS passer à la phase suivante sans validation explicite de Sam.**

---

## 📊 RÉPARTITION DES RÔLES

### 🤖 Claude Code (dans le nouveau projet)

**Responsabilités :**
- Développement rapide du code (backend + frontend)
- Structure de l'application
- Logique métier
- Tests unitaires
- Commit + push sur GitHub après chaque phase validée

**Phases assignées :**
- ✅ P0 - Setup & Architecture (1-2h)
- ✅ P1 - Backend API Core (2-3h)
- ✅ P3 - Frontend UI (3-4h) - sauf intégrations
- ⚠️ P2 - Intégrations (en support de Claude Web si besoin)

**Ne fait PAS :**
- Ne déploie pas sur le serveur
- Ne configure pas Nginx
- Ne teste pas avec les vraies APIs du serveur

---

### 🌐 Claude Web (projet "Digital Humans Migration")

**Responsabilités :**
- Validation de chaque phase selon critères du WBS
- Pull du code GitHub sur le VPS
- Tests en conditions réelles (serveur de production)
- Intégrations avec N8N/Ollama/Ghost (accès direct via MCP)
- Configuration Nginx
- Déploiement final

**Phases assignées :**
- ✅ P2 - Intégrations N8N/Ollama/Ghost/RAG (3-4h)
- ✅ P5 - Authentification (1-2h)
- ✅ P6 - Déploiement & Config Nginx (1h)
- ✅ P7 - Tests & Polish (1-2h)

**Ne fait PAS :**
- Ne réécrit pas le code développé par Claude Code sans raison
- Ne change pas l'architecture sans accord de Sam

---

## 🔄 WORKFLOW GITHUB

### Structure du repository

```
https://github.com/SamHATIT/admin-hub

admin-hub/
├── README.md                    # Description du projet
├── WORKFLOW.md                  # Ce document
├── WBS.md                       # Le WBS détaillé (copie du PITCH)
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── requirements.txt
│   ├── services/
│   │   ├── system_service.py
│   │   ├── n8n_service.py
│   │   ├── ollama_service.py
│   │   └── ghost_service.py
│   └── tests/
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── ServiceCard.jsx
│   │   │   ├── ActionButton.jsx
│   │   │   └── Modal.jsx
│   │   └── services/
│   │       └── api.js
│   ├── package.json
│   └── vite.config.js
└── nginx/
    └── admin-hub.conf
```

### Convention de commits

**Format :**
```
[Phase] Description courte

Détails si nécessaire

Critères validés:
- [ ] Critère 1
- [ ] Critère 2
```

**Exemples :**
```
[P0] Setup initial backend et frontend

- Créé structure dossiers
- Installé FastAPI + React
- Backend démarre sur port 3100

Critères validés:
- [x] Dossier créé et structuré
- [x] Backend démarre sur port test
- [x] Frontend affiche "Hello World"
```

---

## 📅 WORKFLOW DÉTAILLÉ PAR PHASE

### Phase P0 - Setup (Claude Code)

**1. Claude Code dans nouveau projet :**
```
Action: Lire PITCH_ET_WBS_HUB_ADMINISTRATION.md
Action: Créer structure /root/workspace/admin-hub/ (ou en local selon config)
Action: Initialiser backend FastAPI
Action: Initialiser frontend React
Action: Commit + push sur GitHub
Message à Sam: "P0 terminé, critères validés: [liste]. Prêt pour validation."
```

**2. Sam :**
```
Action: Aller dans projet "Digital Humans Migration"
Message à Claude Web: "Valide P0 - pull depuis GitHub et teste"
```

**3. Claude Web :**
```
Action: git pull origin main sur VPS
Action: Vérifier backend démarre (uvicorn app:app --port 3100)
Action: Vérifier frontend affiche "Hello World"
Message à Sam: "P0 validé ✅" OU "P0 non validé ❌ - voici les problèmes..."
```

**4. Sam :**
```
Si validé: Message à Claude Code: "P0 validé, passe à P1"
Si non validé: Message à Claude Code: "Corrige les points suivants..."
```

---

### Phase P1 - Backend Core (Claude Code)

**1. Claude Code :**
```
Action: Développer endpoints /api/services/status et /api/services/action
Action: Créer system_service.py avec méthodes check_port(), execute_command(), get_logs()
Action: Tester en local
Action: Commit + push
Message à Sam: "P1 terminé, critères validés: [liste]. Prêt pour validation."
```

**2. Sam → Claude Web :**
```
Message: "Valide P1"
```

**3. Claude Web :**
```
Action: git pull sur VPS
Action: Tester /api/services/status retourne JSON valide
Action: Tester /api/services/action avec "fuser -k 8002/tcp"
Message à Sam: "P1 validé ✅" ou problèmes détectés
```

---

### Phase P2 - Intégrations (Claude Web - rôle principal)

**1. Sam → Claude Web :**
```
Message: "P1 validé, démarre P2 - Intégrations N8N/Ollama/Ghost"
```

**2. Claude Web :**
```
Action: Développer n8n_service.py DIRECTEMENT sur le VPS (accès MCP à N8N)
Action: Tester avec la vraie API N8N de Sam
Action: Développer ollama_service.py
Action: Tester avec le vrai Ollama du serveur
Action: Développer ghost_service.py
Action: Commit + push sur GitHub
Message à Sam: "P2 terminé. Critères validés: [liste]"
```

**3. Sam → Claude Code (optionnel) :**
```
Si besoin de refactoring: "Pull les changements P2 et améliore la structure si nécessaire"
```

---

### Phase P3 - Frontend UI (Claude Code)

**1. Sam → Claude Code :**
```
Message: "P2 validé, développe P3 - Frontend UI"
```

**2. Claude Code :**
```
Action: git pull (pour avoir les endpoints P2)
Action: Créer composants ServiceCard, ActionButton, Modal
Action: Créer layout grid avec 8 cards
Action: Implémenter modales de confirmation
Action: Implémenter notifications toast
Action: Commit + push
Message à Sam: "P3 terminé"
```

**3. Sam → Claude Web :**
```
Message: "Valide P3"
```

**4. Claude Web :**
```
Action: git pull sur VPS
Action: Build frontend (npm run build)
Action: Tester visuellement chaque composant
Action: Vérifier interactions boutons → API backend
Message à Sam: "P3 validé ✅"
```

---

### Phase P4 - Pages Détail (Claude Code ou Claude Web selon temps)

**Si temps le permet, sinon skip pour l'instant**

---

### Phase P5 - Auth (Claude Web)

**1. Sam → Claude Web :**
```
Message: "Implémente P5 - Authentification"
```

**2. Claude Web :**
```
Action: Créer page login
Action: Implémenter /api/auth/login
Action: Protéger routes avec middleware
Action: Tester login/logout
Action: Commit + push
Message à Sam: "P5 terminé"
```

---

### Phase P6 - Deploy (Claude Web uniquement)

**1. Claude Web :**
```
Action: Créer config nginx/admin-hub.conf
Action: Configurer reverse proxy (location /admin → localhost:3100)
Action: Recharger Nginx
Action: Tester accès https://digital-humans.fr/admin
Message à Sam: "P6 terminé - Hub accessible sur /admin"
```

---

### Phase P7 - Tests finaux (Claude Web)

**1. Claude Web :**
```
Action: Tester TOUS les boutons un par un
Action: Vérifier logs d'actions
Action: Tests responsive
Action: Documentation finale (README.md)
Message à Sam: "P7 terminé - Projet livré ✅"
```

---

## 🚨 GESTION DES PROBLÈMES

### Si Claude Code bloque

**Sam :**
```
Message dans projet Claude Web: "Claude Code bloque sur P1, voici l'erreur: [détails]"
```

**Claude Web :**
```
Action: Analyser le problème
Action: Proposer solution ou prendre le relais si besoin
```

---

### Si Claude Web perd le contexte

**Sam :**
```
Message: "Tu as perdu le contexte. Relis WORKFLOW.md et WBS.md. Nous en sommes à la phase P[X]"
```

**Claude Web :**
```
Action: Relire les documents
Action: Reprendre là où on était
```

---

## 📋 CHECKLIST DE VALIDATION PAR PHASE

### P0 - Setup
- [ ] Repo GitHub créé et accessible
- [ ] Structure dossiers backend/ et frontend/ présente
- [ ] Backend démarre sur port 3100
- [ ] Frontend affiche "Hello World"
- [ ] requirements.txt contient FastAPI
- [ ] package.json contient React

### P1 - Backend Core
- [ ] Endpoint /api/services/status existe et retourne JSON
- [ ] JSON contient état de 7 services minimum
- [ ] Endpoint /api/services/action existe
- [ ] system_service.py a les 3 méthodes (check_port, execute_command, get_logs)
- [ ] Test manuel: POST /api/services/action {"service":"backend","action":"stop"} fonctionne

### P2 - Intégrations
- [ ] /api/n8n/workflows retourne liste workflows
- [ ] /api/ollama/models retourne mistral:7b-instruct
- [ ] /api/ghost/stats retourne nb articles (ou lien Ghost)
- [ ] /api/rag/health retourne 70251 chunks

### P3 - Frontend UI
- [ ] 8 ServiceCard s'affichent
- [ ] Clic sur bouton "Restart" ouvre modal de confirmation
- [ ] Après action, toast de succès/erreur apparaît
- [ ] Tooltips au survol fonctionnent
- [ ] Couleurs correctes (vert=UP, rouge=DOWN)

### P5 - Auth
- [ ] Page /login accessible
- [ ] Login avec credentials corrects → redirect dashboard
- [ ] Logout → retour /login
- [ ] Accès direct à / sans auth → redirect /login

### P6 - Deploy
- [ ] Nginx configuré avec location /admin
- [ ] https://digital-humans.fr/admin accessible
- [ ] Pas d'erreurs CORS
- [ ] HTTPS fonctionne

### P7 - Tests
- [ ] Tous boutons testés manuellement
- [ ] Logs d'actions écrits dans /var/log/admin-hub-actions.log
- [ ] Interface responsive (mobile/tablet)
- [ ] README.md à jour

---

## 🎯 STACK TECHNIQUE CONFIRMÉE

### Backend
- **Framework :** FastAPI 0.104.1 (déjà installé sur VPS)
- **Python :** 3.x (celui du VPS)
- **Port :** 3100
- **Dépendances :**
  - fastapi
  - uvicorn
  - requests (pour APIs N8N/Ghost)
  - python-multipart (pour forms)

### Frontend
- **Framework :** React 19.2.0 (déjà installé sur VPS)
- **Bundler :** Vite (celui déjà utilisé par Digital Humans)
- **Dépendances :**
  - react
  - react-dom
  - axios (pour appels API)
  - react-router-dom (pour routing)

### Serveur
- **OS :** Ubuntu 24.04
- **IP :** 72.61.161.222
- **Nginx :** Version installée
- **Localisation code :** /root/workspace/admin-hub/

---

## 📞 COMMUNICATION ENTRE CLAUDES (via Sam)

### Format des messages

**De Claude Code vers Sam :**
```
✅ Phase P[X] terminée

Critères validés:
- [x] Critère 1
- [x] Critère 2
- [x] Critère 3

Commit: [hash]
Prêt pour validation sur VPS.
```

**De Sam vers Claude Web :**
```
Valide P[X]:
- Pull depuis GitHub
- Teste selon critères WBS
- Confirme validation ou liste problèmes
```

**De Claude Web vers Sam :**
```
P[X] VALIDÉ ✅

Tests effectués:
- Test 1: OK
- Test 2: OK
- Test 3: OK

Prêt pour P[X+1]
```

OU

```
P[X] NON VALIDÉ ❌

Problèmes détectés:
1. Problème X
2. Problème Y

Recommandation: [solution]
```

---

## ⏱️ PLANNING ESTIMÉ

### Jour 1 - Morning (3-4h)
- P0: Setup (1h) - **Claude Code**
- P1: Backend Core (2-3h) - **Claude Code**
- Validation P0+P1 - **Claude Web**

### Jour 1 - Afternoon (3-4h)
- P3.1-P3.2: Frontend basique (2h) - **Claude Code**
- P2.1: N8N Integration (1-2h) - **Claude Web**
- Validation - **Claude Web**

### Jour 2 - Morning (3-4h)
- P2.2-P2.4: Ollama/Ghost/RAG (2h) - **Claude Web**
- P3.3-P3.5: UI Polish (1-2h) - **Claude Code**
- P5: Auth (1h) - **Claude Web**

### Jour 2 - Afternoon (2-3h)
- P6: Deploy (1h) - **Claude Web**
- P7: Tests finaux (1-2h) - **Claude Web**

**Total estimé: 14-18h réparties sur 2 jours**

---

## 🔐 INFORMATIONS SENSIBLES (À CONFIGURER)

### Credentials à définir par Sam

**Auth hub admin :**
- Login: [À définir]
- Password: [À définir]
- Méthode: Hash bcrypt stocké dans config.py

**APIs externes :**
- N8N API Key: [Sam fournira si besoin]
- Ghost Admin API Key: [Sam fournira si besoin]

### Fichiers de config

**backend/config.py :**
```python
# Auth
ADMIN_USERNAME = "sam"  # À changer
ADMIN_PASSWORD_HASH = "..."  # Hash bcrypt

# Services
BACKEND_PORT = 8002
FRONTEND_PORT = 3000
N8N_URL = "https://n8n.samhatit-consulting.cloud"
OLLAMA_URL = "http://localhost:11434"
GHOST_URL = "https://blog-admin.digital-humans.fr"

# Logs
ACTIONS_LOG = "/var/log/admin-hub-actions.log"
```

---

## 📚 DOCUMENTS DE RÉFÉRENCE

Ces documents DOIVENT être uploadés dans le nouveau projet :

1. **PITCH_ET_WBS_HUB_ADMINISTRATION.md** (19 pages)
   - Spécifications complètes
   - WBS détaillé avec critères de validation
   - Pièges à éviter

2. **Guide_Administration_Serveur_Digital_Humans.docx** (v1)
   - Toutes les commandes système
   - Procédures de démarrage/arrêt

3. **Guide_Administration_Serveur_Digital_Humans_v2.docx**
   - Version avec section RAG
   - Commandes à jour

4. **WORKFLOW_DEVELOPPEMENT.md** (ce document)
   - Organisation Claude Code / Claude Web
   - Workflow GitHub
   - Communication entre Claudes

---

## ✅ CRITÈRES DE SUCCÈS FINAL

Le projet est **livré** quand Sam peut :

1. ✅ Se connecter sur https://digital-humans.fr/admin avec login/mdp
2. ✅ Voir l'état de tous les services en un coup d'œil
3. ✅ Redémarrer le backend en 2 clics (bouton + confirmation)
4. ✅ Voir les workflows N8N et leur état
5. ✅ Voir les modèles Ollama installés
6. ✅ Accéder à Ghost/N8N via boutons
7. ✅ Recevoir notifications claires après chaque action
8. ✅ Tout fonctionne sans passer par SSH/CLI

---

## 🚀 COMMANDE DE DÉMARRAGE

**Dans le nouveau projet, Sam dira à Claude Code :**

```
Lis les documents suivants dans cet ordre:
1. PITCH_ET_WBS_HUB_ADMINISTRATION.md
2. WORKFLOW_DEVELOPPEMENT.md

Puis démarre la Phase P0 - Setup.

Stack confirmée:
- Backend: FastAPI (déjà installé sur VPS)
- Frontend: React (déjà installé sur VPS)
- Serveur: 72.61.161.222

Commit chaque phase sur GitHub: https://github.com/SamHATIT/admin-hub

Dis-moi quand P0 est terminé pour validation.
```

---

**Document préparé le 6 février 2026**  
**Version 1.0 - Workflow hybride Claude Code + Claude Web**
