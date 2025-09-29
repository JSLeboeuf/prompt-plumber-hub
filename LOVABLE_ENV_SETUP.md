# Configuration des Variables d'Environnement pour Lovable

## Variables Requises

Ajoutez ces variables dans les paramètres de votre projet Lovable :

### Configuration Supabase (Obligatoire)
```
VITE_SUPABASE_PROJECT_ID=rmtnitwtxikuvnrlsmtq
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdG5pdHd0eGlrdXZucmxzbXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MTc0MjAsImV4cCI6MjA3MzI5MzQyMH0.Wd5fOfMNJ--1E4GTggB4pMW2z0VSZVgHgd0k0e2lOTc
VITE_SUPABASE_URL=https://rmtnitwtxikuvnrlsmtq.supabase.co
```

### Configuration VAPI (Voice AI)
```
VITE_VAPI_PUBLIC_KEY=82335fe0-5117-43fc-aef8-e355d17cf1c9
VITE_VAPI_PRIVATE_KEY=744b8a0f-311e-42db-bf5d-1d1e8e5270b6
VITE_VAPI_ASSISTANT_ID=0dc57f16-be4e-4b63-8245-e81b9df00ba9
VITE_VAPI_WEBHOOK_URL=https://rmtnitwtxikuvnrlsmtq.supabase.co/functions/v1/vapi-webhook
VITE_ENABLE_VAPI=true
```

### Configuration Twilio (SMS)
```
TWILIO_ACCOUNT_SID=[YOUR_TWILIO_ACCOUNT_SID]
TWILIO_AUTH_TOKEN=[YOUR_TWILIO_AUTH_TOKEN]
TWILIO_PHONE_NUMBER=[YOUR_TWILIO_PHONE_NUMBER]
```

**Note:** Les vraies valeurs Twilio sont stockées localement dans votre .env

## Étapes de Configuration

1. **Dans Lovable Dashboard :**
   - Allez dans Settings → Environment Variables
   - Ajoutez chaque variable ci-dessus
   - Sauvegardez les changements

2. **Migration Supabase :**
   - La migration `20250929_create_dashboard_function.sql` doit être appliquée
   - Elle crée la fonction `get_dashboard_metrics_optimized` nécessaire au dashboard

3. **Vérification :**
   - Le dashboard devrait afficher des données réelles
   - Les appels VAPI devraient être fonctionnels
   - Les SMS via Twilio devraient être opérationnels

## Statut de Production

✅ **Prêt pour le déploiement**
- Toutes les erreurs React Hooks corrigées
- Variables d'environnement configurées
- Mock data remplacé par des connexions réelles
- TypeScript strict mode compatible
- GitHub synchronisé et propre

## Notes de Sécurité

⚠️ **Important :** Les clés Twilio et VAPI sont sensibles. Assurez-vous que Lovable les stocke de manière sécurisée et ne les expose jamais côté client.