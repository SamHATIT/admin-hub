# 🎯 PROJECT BRIEF - Hub d'Administration Digital Humans

**Date :** 6 février 2026  
**Projet :** Interface web centralisée de monitoring et contrôle  
**Objectif :** Avoir une visibilité complète sur l'infrastructure et pouvoir administrer les services sans passer par SSH/CLI

---

## 📋 CONTEXTE & PROBLÈME

### Situation actuelle
- Infrastructure multi-services (Digital Humans, Ghost, N8N, Ollama, etc.)
- Pas de visibilité centralisée sur l'état de chaque service
- Découverte de pannes tardivement (ex: N8N ou backend down sans le savoir)
- Administration nécessite SSH et commandes CLI (inconfortable pour un non-tech)
- Commandes documentées dans 2 guides Word qu'il faut ouvrir à chaque fois

### Besoin
Un **hub web unique** qui permet de :
1. Voir l'état de tous les services en un coup d'œil
2. Exécuter les actions d'administration par boutons (start/stop/restart)
3. Accéder rapidement aux interfaces externes (Ghost, N8N, etc.)
4. Avoir un niveau de détail granulaire (workflows N8N, modèles Ollama, etc.)

---

## 🎨 ARCHITECTURE TECHNIQUE

### Stack proposée
- **Frontend :** Page HTML/React standalone avec cards modernes
- **Backend :** Mini-serveur Python (Flask ou FastAPI) pour exécuter les commandes
- **Localisation :** Sous-page du site web digital-humans.fr (pas l'app)
- **Auth :** Login/mdp simple dédié (pas lié au système d'auth de l'app)
- **Port :** Dédié (ex: 3100) avec reverse proxy Nginx

### Intégrations
- **N8N :** API REST + MCP (déjà disponible)
- **Ollama :** CLI `ollama list` + API HTTP (localhost:11434)
- **Ghost :** API Admin (si besoin stats) ou juste lien vers Ghost Admin
- **Services système :** Commandes bash du guide (via subprocess Python)

---

## 📊 SERVICES À MONITORER

### 1. Digital Humans Backend (Port 8002) ⭐ CRITIQUE
**État :** UP/DOWN (check HTTP sur /docs ou /api/health)

**Boutons :**
- 🚀 Démarrer (commande du guide section 3.1)
- 🛑 Arrêter (fuser -k 8002/tcp)
- 🔄 Redémarrer (stop + start)
- 📋 Voir logs (tail -100 /tmp/backend.log)

**Infos :** 
- Temps de réponse API
- Dernière ligne de log (pour debug rapide)

**Lien :** http://72.61.161.222:8002/docs (API Swagger)

---

### 2. Digital Humans Frontend (Port 3000) ⭐ CRITIQUE
**État :** UP/DOWN (check HTTP sur localhost:3000)

**Boutons :**
- 🚀 Démarrer (commande du guide section 3.2)
- 🛑 Arrêter (pkill -f 'vite')
- 🔄 Redémarrer
- 📋 Voir logs (tail -100 /tmp/frontend.log)

**Lien :** http://72.61.161.222 (Frontend public)

---

### 3. N8N Workflows (Port 5678)
**État global :** UP/DOWN (check HTTP sur localhost:5678)

**Détail par workflow :** (via API N8N)
- Nom du workflow
- État : Active ✅ / Inactive ⚠️
- Dernière exécution : timestamp + durée
- Nb erreurs (dernières 24h)

**Boutons par workflow :**
- ▶️ Activer
- ⏸️ Désactiver

**Boutons globaux :**
- 🚀 Démarrer N8N (cd /root && n8n start &)
- 🛑 Arrêter N8N

**Lien :** https://n8n.samhatit-consulting.cloud

---

### 4. Ollama (Port 11434)
**État :** UP/DOWN (check HTTP sur localhost:11434/api/tags)

**Détail par modèle :** (via `ollama list`)
- Nom du modèle (ex: mistral:7b-instruct) 
- Taille (ex: 4.1GB)
- Dernière utilisation (si disponible dans l'API)
- ⚠️ **IMPORTANT :** Le modèle principal est `mistral:7b-instruct` (pas mistral-nemo)

**Boutons :**
- 🚀 Démarrer Ollama (nohup ollama serve > /var/log/ollama.log 2>&1 &)
- 🛑 Arrêter Ollama

**Pas de lien** (service backend uniquement)

---

### 5. Ghost CMS (Port 2368)
**État :** UP/DOWN (check Docker : docker ps | grep ghost)

**Infos :** (via Ghost API si possible, sinon juste lien)
- Nb articles publiés
- Nb brouillons
- Dernière publication (titre + date)

**Boutons :**
- 🔄 Redémarrer (docker restart ghost-blog)

**Lien :** https://blog-admin.digital-humans.fr/ghost (Admin Ghost)

---

### 6. PostgreSQL (Port 5432)
**État :** UP/DOWN (check systemctl status postgresql)

**Boutons :**
- 🔄 Redémarrer (sudo systemctl restart postgresql)

**Pas de lien** (base de données)

---

### 7. Nginx (Ports 80/443)
**État :** UP/DOWN (check systemctl status nginx)

**Boutons :**
- 🔄 Redémarrer (sudo systemctl restart nginx)
- ✅ Tester config (sudo nginx -t)

**Pas de lien** (reverse proxy)

---

### 8. RAG ChromaDB
**État :** Santé de la base (check avec SQLite query)

**Infos :**
- Nb total de chunks (attendu: 70,251)
- Taille base (attendu: 2.4GB)

**Commande vérif :**
```bash
sqlite3 /opt/digital-humans/rag/chromadb_data/chroma.sqlite3 "SELECT COUNT(*) FROM embeddings;"
```

**Pas de boutons d'action** (juste monitoring)

---

## 🔒 SÉCURITÉ & AUTHENTIFICATION

### Login dédié
- **URL :** https://admin.digital-humans.fr (ou /admin sur le site)
- **Auth :** Login/mdp simple en dur dans config (pour l'instant)
- **Login :** À définir par Sam
- **Session :** Cookie sécurisé avec expiration

### Permissions
- Tous les boutons nécessitent confirmation avant exécution
- Logs de toutes les actions (qui a fait quoi, quand)

---

## 🎨 INTERFACE UTILISATEUR

### Layout
```
┌─────────────────────────────────────────────────────┐
│  🏠 Hub Admin Digital Humans          [Refresh] 🔄   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│
│  │ 🟢 Backend   │  │ 🟢 Frontend  │  │ 🔴 N8N     ││
│  │              │  │              │  │            ││
│  │ [Start]      │  │ [Start]      │  │ [Start]    ││
│  │ [Stop]       │  │ [Stop]       │  │            ││
│  │ [Restart]    │  │ [Restart]    │  │ 3 workflows││
│  │ [Logs]       │  │ [Logs]       │  │ 2 actifs   ││
│  │              │  │              │  │ [Détails]  ││
│  │ 🔗 API Docs  │  │ 🔗 Frontend  │  │ 🔗 N8N     ││
│  └──────────────┘  └──────────────┘  └────────────┘│
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│
│  │ 🟢 Ollama    │  │ 🟢 Ghost     │  │ 🟢 PostgreSQL│
│  │              │  │              │  │            ││
│  │ [Start]      │  │ [Restart]    │  │ [Restart]  ││
│  │              │  │              │  │            ││
│  │ 2 modèles    │  │ 5 articles   │  │            ││
│  │ - mistral:7b │  │ 3 brouillons │  │            ││
│  │ [Détails]    │  │ 🔗 Ghost     │  │            ││
│  └──────────────┘  └──────────────┘  └────────────┘│
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Design système
- **Cards :** Style moderne avec ombres légères
- **Couleurs état :** 🟢 Vert (UP) / 🔴 Rouge (DOWN) / ⚠️ Orange (Partial)
- **Tooltips :** Au survol des boutons (ex: "Démarrer le backend FastAPI - Port 8002")
- **Feedback :** Notifications toast en haut à droite après actions
- **Refresh :** Bouton manuel (pas auto-refresh pour économiser ressources)

---

## ⚙️ FONCTIONNALITÉS CRITIQUES

### 1. Confirmation avant actions
Exemple :
```
┌─────────────────────────────────────┐
│ ⚠️  Confirmer l'action              │
├─────────────────────────────────────┤
│ Voulez-vous vraiment redémarrer     │
│ le Backend FastAPI ?                │
│                                     │
│ Cette action peut prendre 10-15s    │
│                                     │
│         [Annuler]    [Confirmer]    │
└─────────────────────────────────────┘
```

### 2. Feedback visuel post-action
```
┌─────────────────────────────────────┐
│ ✅ Backend redémarré avec succès    │
│ Temps d'exécution : 12s             │
└─────────────────────────────────────┘
```

Ou en cas d'erreur :
```
┌─────────────────────────────────────┐
│ ❌ Erreur lors du redémarrage       │
│ Port 8002 déjà utilisé              │
│ [Voir les détails]                  │
└─────────────────────────────────────┘
```

### 3. Loading states
Pendant qu'une action s'exécute :
- Bouton désactivé + spinner
- Message "Redémarrage en cours..."
- Timeout après 60s avec message d'erreur

---

## 📁 STRUCTURE FICHIERS

```
/root/workspace/admin-hub/
├── backend/
│   ├── app.py              # Serveur Flask/FastAPI
│   ├── config.py           # Config (auth, paths, etc.)
│   ├── services/
│   │   ├── system_service.py    # Commandes système (start/stop)
│   │   ├── n8n_service.py       # API N8N
│   │   ├── ollama_service.py    # Ollama CLI wrapper
│   │   └── ghost_service.py     # Ghost API (si besoin)
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── app.js              # Logic React/Vue
│   ├── styles.css
│   └── components/
│       ├── ServiceCard.js
│       ├── ActionButton.js
│       └── Modal.js
└── nginx/
    └── admin-hub.conf      # Config Nginx pour reverse proxy
```

---

## 🚀 WBS - WORK BREAKDOWN STRUCTURE

### Phase 0 - Setup & Architecture (1-2h)
**P0.1** Créer le dossier projet `/root/workspace/admin-hub/`
**P0.2** Initialiser backend Python (venv + requirements.txt)
**P0.3** Initialiser frontend (structure HTML/CSS/JS de base)
**P0.4** Décider stack finale : Flask ou FastAPI ? React ou Vanilla JS ?

**Critères de validation :**
- [ ] Dossier créé et structuré
- [ ] Backend démarre sur port test (ex: 3100)
- [ ] Frontend affiche "Hello World"

---

### Phase 1 - Backend API Core (2-3h)

**P1.1** Créer endpoint `/api/services/status` qui retourne état de tous les services
```json
{
  "backend": {"status": "up", "port": 8002, "response_time_ms": 45},
  "frontend": {"status": "up", "port": 3000},
  "n8n": {"status": "down", "port": 5678},
  ...
}
```

**P1.2** Créer service `system_service.py` avec méthodes :
- `check_port(port)` → bool (UP/DOWN)
- `execute_command(command)` → output
- `get_logs(filepath, lines=100)` → string

**P1.3** Créer endpoint `/api/services/action` (POST)
```json
{
  "service": "backend",
  "action": "start|stop|restart|logs"
}
```

**P1.4** Sécuriser l'API avec auth simple (header token ou session)

**Critères de validation :**
- [ ] `/api/services/status` retourne JSON valide pour les 7 services
- [ ] `/api/services/action` exécute bien `fuser -k 8002/tcp` quand on demande stop backend
- [ ] Auth fonctionne (requête sans auth = 401)

---

### Phase 2 - Intégrations Spécifiques (3-4h)

**P2.1 - N8N Integration**
- Créer `n8n_service.py`
- Méthode `get_workflows()` → liste workflows via API N8N
- Méthode `get_workflow_executions(workflow_id)` → dernières exécutions
- Endpoint `/api/n8n/workflows`
- Endpoint `/api/n8n/workflow/{id}/toggle` (activate/deactivate)

**P2.2 - Ollama Integration**
- Créer `ollama_service.py`
- Méthode `list_models()` qui parse `ollama list`
- Endpoint `/api/ollama/models`

**P2.3 - Ghost Integration**
- Créer `ghost_service.py`
- Méthode `get_stats()` → nb articles publiés/brouillons (via API Ghost si possible)
- Ou juste retourner un lien vers Ghost Admin si API compliquée
- Endpoint `/api/ghost/stats`

**P2.4 - RAG Health Check**
- Méthode `check_rag_health()` qui exécute la query SQLite
- Endpoint `/api/rag/health`

**Critères de validation :**
- [ ] `/api/n8n/workflows` retourne la liste des workflows
- [ ] `/api/ollama/models` retourne mistral:7b-instruct
- [ ] `/api/ghost/stats` retourne nb articles (ou lien)
- [ ] `/api/rag/health` retourne 70251 chunks

---

### Phase 3 - Frontend UI (3-4h)

**P3.1** Créer composant `ServiceCard`
- Props: {name, status, port, actions[], link, details}
- Affiche état coloré (vert/rouge/orange)
- Boutons dynamiques selon actions disponibles

**P3.2** Créer page principale avec layout grid cards
- 7 cards principales (Backend, Frontend, N8N, Ollama, Ghost, PostgreSQL, Nginx)
- 1 card supplémentaire pour RAG (monitoring only)

**P3.3** Implémenter modales de confirmation
- Modal générique réutilisable
- Passer props: {title, message, onConfirm, onCancel}

**P3.4** Implémenter notifications toast
- Succès : fond vert, icône ✅
- Erreur : fond rouge, icône ❌
- Auto-dismiss après 5s

**P3.5** Implémenter tooltips au survol des boutons

**Critères de validation :**
- [ ] 8 cards s'affichent correctement
- [ ] Bouton "Restart Backend" ouvre modal de confirmation
- [ ] Après action, toast apparaît avec succès/erreur
- [ ] Tooltips s'affichent au survol

---

### Phase 4 - Pages de Détail (2-3h)

**P4.1** Page détail N8N
- Liste tous les workflows
- Pour chaque : nom, état, dernière exec, bouton toggle
- Modal pour voir logs d'exécution si besoin

**P4.2** Page détail Ollama
- Liste tous les modèles
- Pour chaque : nom, taille, dernière utilisation
- Pas d'actions nécessaires

**Critères de validation :**
- [ ] Clic sur "Détails" de N8N ouvre page avec workflows
- [ ] Clic sur "Détails" Ollama ouvre page avec modèles

---

### Phase 5 - Authentification (1-2h)

**P5.1** Créer page de login
- Form simple : username + password
- POST vers `/api/auth/login`
- Si success → set cookie session + redirect vers dashboard

**P5.2** Protéger toutes les routes
- Middleware qui check session
- Si pas authentifié → redirect vers /login

**P5.3** Bouton logout dans header

**Critères de validation :**
- [ ] Accès direct à / redirect vers /login si pas authentifié
- [ ] Login avec bonnes credentials → accès au dashboard
- [ ] Logout → retour à /login

---

### Phase 6 - Déploiement & Config Nginx (1h)

**P6.1** Créer config Nginx pour reverse proxy
```nginx
location /admin {
    proxy_pass http://localhost:3100;
}
```

**P6.2** Tester sur https://digital-humans.fr/admin

**P6.3** Ou créer sous-domaine https://admin.digital-humans.fr (selon préférence Sam)

**Critères de validation :**
- [ ] Hub accessible via URL publique
- [ ] HTTPS fonctionne
- [ ] Pas de CORS errors

---

### Phase 7 - Tests & Polish (1-2h)

**P7.1** Tester tous les boutons d'action
- Start/Stop/Restart Backend
- Start/Stop/Restart Frontend
- Start/Stop N8N
- Restart Ghost
- Restart PostgreSQL
- Restart Nginx

**P7.2** Tester toutes les intégrations
- Workflows N8N s'affichent correctement
- Modèles Ollama s'affichent correctement
- Stats Ghost s'affichent correctement

**P7.3** Vérifier les logs d'actions
- Créer fichier `/var/log/admin-hub-actions.log`
- Logger chaque action avec timestamp + user

**P7.4** Responsive design (mobile/tablet)

**Critères de validation :**
- [ ] Tous les boutons fonctionnent sans erreur
- [ ] Toutes les infos s'affichent correctement
- [ ] Logs d'actions sont écrits
- [ ] Interface responsive

---

## ⏱️ ESTIMATION TOTALE

| Phase | Durée estimée | Priorité |
|-------|--------------|----------|
| P0 - Setup | 1-2h | P0 |
| P1 - Backend Core | 2-3h | P0 |
| P2 - Intégrations | 3-4h | P1 |
| P3 - Frontend UI | 3-4h | P0 |
| P4 - Pages détail | 2-3h | P2 |
| P5 - Auth | 1-2h | P1 |
| P6 - Deploy | 1h | P0 |
| P7 - Tests | 1-2h | P1 |
| **TOTAL** | **14-21h** | **~2 jours** |

---

## 🎯 ORDRE D'EXÉCUTION RECOMMANDÉ

**Jour 1 (Morning) :**
1. P0 - Setup
2. P1 - Backend Core
3. P3.1-P3.2 - Frontend basique

**Jour 1 (Afternoon) :**
4. P2.1 - N8N Integration
5. P2.2 - Ollama Integration
6. P3.3-P3.5 - UI Polish (modals, toasts, tooltips)

**Jour 2 (Morning) :**
7. P2.3-P2.4 - Ghost + RAG
8. P5 - Auth
9. P6 - Deploy

**Jour 2 (Afternoon) :**
10. P4 - Pages détail (si temps)
11. P7 - Tests finaux

---

## 📝 NOTES IMPORTANTES POUR LE DÉVELOPPEMENT

### ⚠️ PIÈGES À ÉVITER

1. **Ne pas réinventer les commandes** → Elles sont TOUTES dans les 2 guides d'admin (v1 et v2), copier-coller exactement
2. **Ne pas oublier les confirmations** → Chaque action destructive doit avoir une modale de confirmation
3. **Ne pas négliger les feedbacks** → Toujours afficher le résultat d'une action (succès/erreur)
4. **Ne pas faire d'auto-refresh** → Bouton manuel uniquement pour économiser ressources
5. **Attention aux timeouts** → Les redémarrages peuvent prendre 10-15s, prévoir un timeout de 60s

### ✅ BONNES PRATIQUES

1. **Valider à chaque phase** → Ne passer à la phase suivante que si la précédente est 100% validée
2. **Logs détaillés** → Logger chaque action dans `/var/log/admin-hub-actions.log`
3. **Error handling robuste** → Wrapper toutes les commandes subprocess dans try/catch
4. **UI consistent** → Utiliser les mêmes couleurs/icônes pour les mêmes états
5. **Documentation inline** → Commenter le code pour maintenance future

---

## 🔗 RÉFÉRENCES

- **Guide Admin v1 :** Uploadé dans project knowledge
- **Guide Admin v2 :** Uploadé dans project knowledge
- **API N8N :** https://docs.n8n.io/api/
- **API Ollama :** https://github.com/ollama/ollama/blob/main/docs/api.md
- **API Ghost :** https://ghost.org/docs/admin-api/

---

## 🎓 CRITÈRES DE SUCCÈS FINAL

Le projet est considéré comme **réussi** si :

✅ Je peux voir l'état de tous les services d'un coup d'œil  
✅ Je peux redémarrer le backend en 2 clics (bouton + confirmation)  
✅ Je peux voir les workflows N8N et leur état sans ouvrir N8N  
✅ Je peux voir les modèles Ollama installés  
✅ Je reçois une notification claire après chaque action  
✅ L'interface est accessible depuis mon navigateur (pas de CLI)  
✅ Tout est sécurisé derrière login/mdp  

---

**Document préparé le 6 février 2026**  
**Version 1.0**
