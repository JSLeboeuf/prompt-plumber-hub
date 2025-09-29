# Drain Fortin SaaS Dashboard

## 🚀 Vue d'ensemble
Dashboard SaaS complet pour la gestion d'interventions de plomberie d'urgence. Interface moderne, responsive, et optimisée pour les équipes terrain.

## 🎨 Design System
- **Couleur primaire**: Orange professionnel (#ea580c)
- **Accessibilité**: WCAG AA/AAA
- **Responsive**: 320px → 1920px+
- **Typographie**: Inter/Helvetica

## 📦 Modules Principaux

### 1. 📞 File d'Appels Urgents
- Tri automatique par priorité
- Badges colorés (P1/P2/P3)
- Prise et assignation en 1 clic

### 2. 👥 CRM Clients
- Fiches clients rapides
- Scoring automatique
- Timeline d'activités
- Recherche temps réel

### 3. 🛠️ Interventions
- Vue Kanban + Calendrier
- Drag & drop
- Géolocalisation intégrée

### 4. 📊 Analytics
- KPIs temps réel
- Graphiques de tendances
- Export CSV/PDF

### 5. 🛡️ Conformité & Logs
- Statuts RGPD/Loi 25
- Audit trail complet
- Gestion des droits

### 6. 🤝 Support Widget
- Chatbot IA intégré
- Support VAPI vocal
- SMS Twilio

### 7. 👤 Multi-rôles
- Admin/Agent/Client
- Vues et droits distincts

### 8. 🚨 Alertes Système
- Toasts intelligents
- Bannières persistantes
- Auto-dismiss configurable

## 🔧 Configuration

### Variables d'environnement
```env
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

# VAPI (Voice AI)
VITE_VAPI_PUBLIC_KEY=your-vapi-key
VITE_VAPI_ASSISTANT_ID=your-assistant-id

# Twilio SMS
VITE_TWILIO_ACCOUNT_SID=your-account-sid

# n8n Automation (base URL)
VITE_N8N_BASE_URL=

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=

# Environment
VITE_ENVIRONMENT=development
```

### Fichier d'exemple d'environnement

- Copiez `.env.example` en `.env.local` et remplissez les variables requises.

### Installation
```bash
npm install
npm run dev
```

## ✅ Production Checklist
- **Front-end secrets**: copy `.env.local.example`, configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPI_PUBLIC_KEY`, `VITE_VAPI_ASSISTANT_ID`, `VITE_TWILIO_ACCOUNT_SID`, `VITE_GOOGLE_MAPS_API_KEY`.
- **Edge function secrets**: copy `supabase/.env.example`, provide `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VAPI_API_KEY`, and Twilio credentials.
- **Health check**: `/functions/v1/health-check` should report `vapi.configured` based on `VAPI_API_KEY` and `twilio.configured` when all `TWILIO_*` variables are set.
- **Feature flags**: toggle `VITE_ENABLE_VAPI`, `VITE_ENABLE_SMS`, `VITE_ENABLE_MAPS`, `VITE_ENABLE_AUTOMATION`, `VITE_ENABLE_CALLS` to enable integrations safely when keys exist.
- **QA commands**: `npm run lint`, `npx tsc --noEmit`, `npm run build` (plus `npm run test` / `npm run test:e2e` when applicable).

## 🧪 QA Pipeline

The project includes a comprehensive QA pipeline for validating code quality. Run these commands in order:

### 1. Linting
```bash
npm run lint
# Output: qa-logs/lint.log
# Note: 16 existing errors (not from migration), 193 warnings
```

### 2. TypeScript Check
```bash
npx tsc --noEmit
# Output: qa-logs/tsc.log
# Status: ✅ Passing - No type errors
```

### 3. Build
```bash
npm run build
# Output: qa-logs/build.log
# Status: ✅ Passing - Builds in ~23s
```

### 4. Unit Tests
```bash
npm run test
# Output: qa-logs/unit.log
# Status: ⚠️ Partial - Test environment needs setup
```

### 5. E2E Tests
```bash
# First install Playwright browsers (one time)
npx playwright install chromium

# Run tests (requires dev server running)
npm run dev &  # In one terminal
npx playwright test  # In another terminal
# Output: qa-logs/e2e.log
```

### Full QA Check
```bash
# Run all checks and save to qa-logs/
mkdir -p qa-logs
npm run lint > qa-logs/lint.log 2>&1
npx tsc --noEmit > qa-logs/tsc.log 2>&1
npm run build > qa-logs/build.log 2>&1
npm run test > qa-logs/unit.log 2>&1
npx playwright test > qa-logs/e2e.log 2>&1
```

For detailed migration status, see [INTEGRATION_REPORT.md](./INTEGRATION_REPORT.md)

## 🌍 Intégrations Cloud

### Supabase
- **Auth**: Authentification multi-rôles
- **Database**: CRUD temps réel
- **Realtime**: Événements live
- **Storage**: Fichiers clients

### VAPI (Voice AI)
- **Webhook**: `/api/vapi/webhook`
- **Transcripts**: Affichage temps réel
- **Assistant**: Support vocal intelligent

### n8n (Automation)
- **Webhooks**: Workflows automatisés
- **Notifications**: Alertes métier
- **Intégrations**: APIs tierces

### Twilio (SMS)
- **Notifications**: Clients/équipes
- **Confirmations**: RDV/interventions
- **Urgences**: Alertes critiques

### Google Maps
- **Géolocalisation**: Clients/interventions
- **Optimisation**: Trajets équipes
- **Visualisation**: Cartes interactives

## 🏗️ Architecture

### Structure des dossiers
```
src/
├── components/
│   ├── alerts/          # Système d'alertes
│   ├── auth/            # Authentification
│   ├── charts/          # Graphiques
│   ├── forms/           # Formulaires
│   ├── layout/          # Layout principal
│   ├── maps/            # Géolocalisation
│   ├── support/         # Widget support
│   └── ui/              # Composants UI
├── hooks/               # Hooks personnalisés
├── lib/                 # Utilitaires
├── pages/               # Pages principales
├── services/            # Services API
├── types/               # Types TypeScript
└── utils/               # Fonctions utiles
```

### State Management
- **React Query**: Cache et synchronisation API
- **Context API**: État global application
- **Local Storage**: Préférences utilisateur

## 🔒 Sécurité & Conformité

### RGPD/Loi 25
- Audit trail complet
- Export de données
- Gestion des consentements
- Suppression données

### Authentification
- JWT sécurisés
- Rôles granulaires
- Sessions monitoring

## 📱 Responsive Design

### Breakpoints
- **Mobile**: 320px → 768px
- **Tablet**: 768px → 1024px
- **Desktop**: 1024px+

### Navigation mobile
- Menu hamburger
- Bottom tabs critiques
- Swipe gestures

## 🚀 Déploiement

### Prérequis
1. Compte Supabase configuré
2. Clés API tierces activées
3. Variables d'environnement définies

### Production
```bash
npm run build
npm run preview
```

## 📞 Support Technique

### Contacts urgents
- **Email**: support@drainfortin.com
- **Téléphone**: +1 438 601 2625
- **Chat**: Widget intégré

### Documentation API
- Supabase: [docs.supabase.com](https://docs.supabase.com)
- VAPI: [docs.vapi.ai](https://docs.vapi.ai)
- Twilio: [docs.twilio.com](https://docs.twilio.com)

---

**Drain Fortin SaaS** - Plomberie d'urgence digitalisée 🔧💧

## 🧪 Tests

- Unitaire: Vitest + React Testing Library
- E2E: Playwright

Commandes:

```bash
npm run test        # unitaires
npm run coverage    # couverture V8
npm run test:e2e    # e2e (nécessite npm run dev)
```

## 🌐 i18n

- i18next initialisé (fr par défaut, fallback en)
- Fichier: `src/i18n.ts`

## ♿ Accessibilité

- @axe-core/react activé en développement pour détecter les erreurs a11y

## 📦 Visualisation bundle

- Ajoutez le plugin `rollup-plugin-visualizer` dans la config Vite pour analyser la taille des bundles.

## 🔁 CI/CD (à configurer)

- Lint + Type-check + Tests + Build (GitHub Actions recommandé)
- Budgets de perf/a11y via Lighthouse CI (optionnel)

## 🧭 Onboarding & Contribuer

### Prérequis
- Node.js 20+
- npm 10+
- Compte Supabase configuré (variables d'env)

### Installation
```bash
npm ci --no-audit --no-fund
```

### Lancement (Windows)
Si `npm run dev` échoue, utilisez les binaires locaux:
```bash
node node_modules/vite/bin/vite.js          # dev
node node_modules/vite/bin/vite.js build    # build
npm run preview                              # preview
```

### Qualité
```bash
npx tsc --noEmit
npx eslint .
npx vitest run
# E2E
npx @playwright/test install
node node_modules/@playwright/test/cli.js test
```

### CI/CD
- CI (lint + tsc + unit + build) via `.github/workflows/ci.yml`
- E2E Playwright via `.github/workflows/e2e.yml`
- Lighthouse (perf/a11y) via `.github/workflows/lighthouse.yml`
