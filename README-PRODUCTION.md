# 🚀 Dashboard Drain Fortin SaaS - Guide Production

## 📋 Documentation de Production Client

Dashboard professionnel certifié **sans mock data** pour la gestion opérationnelle des services Drain Fortin.

---

## 🎯 Architecture Production

### Frontend React + Supabase
- **Framework :** React 18 + TypeScript + Vite
- **UI :** Tailwind CSS + shadcn/ui components
- **Backend :** Supabase (Database + Edge Functions + Real-time)
- **État :** React Query + Context providers
- **Routing :** React Router v6

### Intégrations Cloud
- **Base de données :** PostgreSQL via Supabase
- **Authentification :** Supabase Auth (optionnel)
- **SMS :** Twilio via Edge Functions
- **IA Vocale :** VAPI webhooks
- **Automation :** n8n workflows
- **Géolocalisation :** Google Maps API

---

## 🔧 Configuration Environnement

### Variables .env Requises

Créez un fichier `.env.local` avec les configurations suivantes :

```bash
# === SUPABASE CORE (REQUIS) ===
VITE_SUPABASE_URL=https://rmtnitwtxikuvnrlsmtq.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# === INTÉGRATIONS OPTIONNELLES ===
# VAPI Voice AI
VITE_VAPI_PUBLIC_KEY=your-vapi-public-key
VITE_VAPI_ASSISTANT_ID=your-assistant-id

# Twilio SMS (configuré via Supabase Secrets)
# Pas de variables frontend nécessaires

# n8n Automation
VITE_N8N_BASE_URL=https://your-n8n-instance.com

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### Secrets Supabase (Backend)

Les clés sensibles sont stockées de manière sécurisée via Supabase Secrets :

```bash
# Dans Supabase Dashboard > Settings > Edge Functions
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number
VAPI_SERVER_SECRET=your-vapi-server-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🗄️ Base de Données Supabase

### Tables Production Utilisées

```sql
-- Appels d'urgence (CORE)
vapi_calls (id, call_id, customer_name, phone_number, priority, status, metadata, timestamps)

-- CRM Clients (CORE)  
clients (id, name, phone, email, address, status, tags, notes, service_history, timestamps)

-- Prospects (CORE)
leads (id, nom, telephone, email, service, status, priorite, source, metadata, timestamps)

-- Analytics & Métriques (CORE)
analytics (id, event_type, event_data, session_id, user_id, timestamp)

-- Logs SMS (CORE)
sms_logs (id, customer_phone, message, priority, recipients, timestamps)

-- Support (OPTIONNEL)
support_tickets (id, titre, description, statut, priorite, timestamps)
faq (id, question, reponse, category)

-- Interventions (OPTIONNEL)
interventions (id, titre, client_name, adresse, statut, priorite, timestamps)
```

### Fonctions Database Requises

```sql
-- Fonction analytics optimisée (REQUIS)
get_dashboard_metrics_optimized(time_period text DEFAULT '24h')
RETURNS json

-- Fonction de mise à jour timestamps (REQUIS)
update_updated_at_column()
RETURNS trigger
```

---

## 📡 Endpoints API Documentés

### Supabase REST API

| Endpoint | Méthode | Description | Module |
|----------|---------|-------------|---------|
| `/rest/v1/vapi_calls` | GET/POST/PUT | Gestion appels urgence | Appels |
| `/rest/v1/clients` | GET/POST/PUT | Base données CRM | CRM |
| `/rest/v1/leads` | GET/POST/PUT | Gestion prospects | CRM |
| `/rest/v1/analytics` | GET/POST | Événements metrics | Analytics |
| `/rest/v1/sms_logs` | GET/POST | Historique SMS | Support |
| `/rest/v1/rpc/get_dashboard_metrics_optimized` | POST | Métriques dashboard | Analytics |

### Edge Functions Supabase

| Function | Description | Intégration | Status |
|----------|-------------|-------------|---------|
| `vapi-webhook` | Webhooks appels IA | VAPI | Production |
| `send-sms` | Envoi SMS Twilio | Twilio | Production |
| `support-feedback` | Formulaires support | Interne | Production |
| `health` | Health check services | Monitoring | Production |

### APIs Externes

| Service | Endpoint | Usage | Configuration |
|---------|----------|-------|---------------|
| Google Maps | `maps.googleapis.com/maps/api/geocode/json` | Géolocalisation | API Key requise |
| n8n Webhooks | `your-n8n.com/webhook/*` | Automation | URL personnalisée |

---

## 📱 Modules Dashboard

### 1. Dashboard Principal (`/dashboard`)
- **Données :** Métriques temps réel Supabase
- **Fallback :** Indicateurs à zéro si pas de données
- **Requêtes :** `get_dashboard_metrics_optimized`

### 2. File d'Appels (`/dashboard/calls`)
- **Données :** Table `vapi_calls` + real-time subscriptions
- **Fallback :** Message "Aucun appel d'urgence"
- **CRUD :** Création, mise à jour statuts, assignation

### 3. CRM Clients (`/dashboard/crm`)
- **Données :** Tables `clients` + `leads`
- **Fallback :** "Aucun client enregistré"
- **Features :** Recherche, ajout, édition, historique

### 4. Interventions (`/dashboard/interventions`)
- **Données :** Table `interventions` (si configurée)
- **Fallback :** Interface création + message vide
- **Vue :** Kanban par statuts + calendrier

### 5. Analytics (`/dashboard/analytics`)
- **Données :** Fonction analytics + aggregations temps réel
- **Fallback :** Graphiques vides avec axes
- **Métriques :** Appels, conversions, satisfaction

### 6. Support (`/dashboard/support`)
- **Données :** Tables `support_tickets` + `faq` (optionnel)
- **Fallback :** Formulaire contact + chat basic
- **Features :** Tickets, FAQ, chatbot, urgences

---

## ⚠️ Gestion d'Erreurs & Loaders

### Patterns Implémentés

```typescript
// 1. État de chargement systématique
const [loading, setLoading] = useState(true);

// 2. Gestion d'erreurs avec toasts
try {
  const { data, error } = await supabase.from('table').select();
  if (error) throw error;
  setData(data || []);
} catch (err) {
  console.error('Erreur:', err);
  error("Erreur", "Message utilisateur approprié");
} finally {
  setLoading(false);
}

// 3. Fallbacks UI appropriés
{data.length === 0 && (
  <div className="text-center py-8">
    <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
    <h3>Aucune donnée</h3>
    <p>Description appropriée du contexte</p>
    <Button>Action de création</Button>
  </div>
)}
```

### Messages d'État Standards

- **Chargement :** `"Chargement des [ressource]..."`
- **Vide :** `"Aucun(e) [ressource] enregistré(e)"`
- **Erreur :** `"Impossible de charger les [ressource]"`
- **Succès :** `"[Action] effectuée avec succès"`

---

## 🚀 Déploiement Production

### 1. Build Optimisé

```bash
# Installation dependencies
npm install

# Build production
npm run build

# Preview build (optionnel)
npm run preview
```

### 2. Variables d'Environnement

Configurez toutes les variables `.env.local` selon votre environnement.

### 3. Configuration Supabase

1. **Database :** Créez les tables requises via migrations SQL
2. **RLS :** Configurez les politiques de sécurité appropriées
3. **Edge Functions :** Déployez les fonctions via Supabase CLI
4. **Secrets :** Configurez les clés API dans Dashboard > Settings

### 4. Tests Avant Déploiement

```bash
# Vérification build
npm run build

# Tests fonctionnels
npm run test (si configuré)

# Validation data sources
# Vérifiez que toutes les requêtes Supabase fonctionnent
```

---

## 🔧 Maintenance & Monitoring

### Logs de Production

- **Frontend :** Console browser pour debugging client
- **Backend :** Supabase Dashboard > Edge Functions > Logs
- **Database :** Supabase Dashboard > SQL Editor pour requêtes

### Health Checks

Le composant `HealthCheck` surveille automatiquement :
- Connexion Supabase
- APIs externes (VAPI, Twilio, Maps)
- Edge Functions status

### Mise à Jour

```bash
# Update dependencies
npm update

# Rebuild after changes
npm run build

# Redeploy edge functions (si modifiées)
supabase functions deploy
```

---

## 📋 Checklist Production

### ✅ Configuration
- [ ] Variables `.env.local` configurées
- [ ] Secrets Supabase configurés
- [ ] Tables database créées
- [ ] RLS policies activées

### ✅ Fonctionnalités
- [ ] Tous les modules chargent sans erreur
- [ ] CRUD operations fonctionnent
- [ ] Real-time subscriptions actives
- [ ] Edge functions déployées

### ✅ UX/UI
- [ ] Loaders sur toutes les requêtes
- [ ] Messages d'erreur appropriés
- [ ] États vides avec actions
- [ ] Responsive design vérifié

### ✅ Sécurité
- [ ] Aucune clé API exposée côté client
- [ ] RLS configurée pour données sensibles
- [ ] Edge functions authentifiées

---

## 🆘 Troubleshooting

### Erreurs Courantes

**"Supabase connection failed"**
- Vérifiez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
- Contrôlez les CORS dans Supabase Dashboard

**"Function not found"**
- Déployez les Edge Functions : `supabase functions deploy`
- Vérifiez les secrets dans Dashboard > Settings

**"Table does not exist"**
- Créez les tables manquantes via migrations SQL
- Vérifiez les permissions RLS

**"No data displayed"**
- Normal si pas de données en base
- Vérifiez que les fallbacks s'affichent correctement

---

## 📞 Support

Pour assistance technique ou questions de configuration :

- **Email :** support@drainfortin.com
- **Téléphone :** +1 438 601 2625
- **Documentation :** Ce README + commentaires code

---

*Dashboard certifié production-ready sans mock data - Version 1.0.0*