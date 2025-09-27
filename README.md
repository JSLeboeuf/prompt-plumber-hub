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
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# VAPI (Voice AI)
VITE_VAPI_PUBLIC_KEY=your-vapi-key
VITE_VAPI_ASSISTANT_ID=your-assistant-id

# Twilio SMS
VITE_TWILIO_ACCOUNT_SID=your-account-sid

# n8n Automation
VITE_N8N_WEBHOOK_URL=https://your-n8n.app/webhook/drain-fortin

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your-maps-key

# Environment
VITE_ENVIRONMENT=development
```

### Installation
```bash
npm install
npm run dev
```

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