#!/bin/bash

# Test Webhooks Script for Drain Fortin SaaS
# Production-ready webhook testing with cURL commands

SUPABASE_URL="https://rmtnitwtxikuvnrlsmtq.supabase.co"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdG5pdHd0eGlrdXZucmxzbXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MTc0MjAsImV4cCI6MjA3MzI5MzQyMH0.Wd5fOfMNJ--1E4GTggB4pMW2z0VSZVgHgd0k0e2lOTc"

echo "🔧 Drain Fortin - Tests des Webhooks de Production"
echo "================================================"

# VAPI Call Test
echo "📞 Test VAPI Call..."
curl -X POST "$SUPABASE_URL/functions/v1/vapi-call" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+14385550123",
    "assistant_id": "test-assistant",
    "context": {
      "client_name": "Jean Dupont",
      "urgency": "high",
      "call_type": "emergency"
    }
  }' \
  --verbose

echo -e "\n"

# Twilio SMS Test
echo "📱 Test Twilio SMS..."
curl -X POST "$SUPABASE_URL/functions/v1/send-sms" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+14385550123",
    "message": "Test SMS Drain Fortin - Votre intervention est confirmée",
    "client_name": "Jean Dupont",
    "service_type": "emergency",
    "priority": "high"
  }' \
  --verbose

echo -e "\n"

# Emergency Call Creation Test
echo "🚨 Test Création Appel d'Urgence..."
curl -X POST "$SUPABASE_URL/rest/v1/vapi_calls" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "apikey: $API_KEY" \
  -H "Prefer: return=representation" \
  -d '{
    "call_id": "test-emergency-001",
    "customer_name": "Marie Martin Test",
    "phone_number": "+15145550456",
    "priority": "P1",
    "status": "pending",
    "metadata": {
      "source": "webhook_test",
      "description": "Test urgence - Tuyau éclaté"
    }
  }' \
  --verbose

echo -e "\n"

# Client Creation Test
echo "👥 Test Création Client CRM..."
curl -X POST "$SUPABASE_URL/rest/v1/clients" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "apikey: $API_KEY" \
  -H "Prefer: return=representation" \
  -d '{
    "name": "Test Client Webhook",
    "phone": "+15551234567",
    "email": "test@drainfortin.com",
    "address": "123 Test Street, Montreal, QC",
    "lead_score": 75,
    "status": "active",
    "tags": ["test", "webhook"],
    "notes": "Client créé via test webhook"
  }' \
  --verbose

echo -e "\n"

# Support Feedback Test
echo "🎧 Test Support Feedback..."
curl -X POST "$SUPABASE_URL/functions/v1/support-feedback" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "chat",
    "message": "Test feedback automatique - Excellent service!",
    "client_info": {
      "name": "Test Client",
      "phone": "+14385550123",
      "email": "test@client.com"
    },
    "urgency": "low",
    "metadata": {
      "rating": 5,
      "source": "webhook_test"
    }
  }' \
  --verbose

echo -e "\n"

# n8n Webhook Test
echo "⚡ Test n8n Webhook (Emergency Call)..."
curl -X POST "https://your-n8n-instance.com/webhook/emergency-call" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "emergency_call",
    "call": {
      "id": "test-call-001",
      "customer_name": "Test Emergency Client",
      "phone": "+14385550123",
      "priority": "P1",
      "description": "Test webhook n8n - Urgence plomberie"
    },
    "actions_required": [
      "notify_on_duty_technician",
      "send_sms_confirmation"
    ],
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
    "source": "drain-fortin-dashboard"
  }' \
  --verbose || echo "⚠️  n8n webhook URL non configurée"

echo -e "\n"

# Analytics Event Test
echo "📊 Test Analytics Event..."
curl -X POST "$SUPABASE_URL/rest/v1/analytics_events" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "apikey: $API_KEY" \
  -H "Prefer: return=representation" \
  -d '{
    "event_type": "webhook_test",
    "event_data": {
      "test_type": "production_validation",
      "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
      "success": true
    },
    "session_id": "test-session-001"
  }' \
  --verbose

echo -e "\n"

# Audit Log Test
echo "🔍 Test Audit Log..."
curl -X POST "$SUPABASE_URL/rest/v1/audit_logs" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "apikey: $API_KEY" \
  -H "Prefer: return=representation" \
  -d '{
    "action": "webhook_test",
    "resource_type": "system",
    "resource_id": "webhook-validation",
    "details": {
      "test_suite": "production_validation",
      "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
      "all_tests_passed": true
    }
  }' \
  --verbose

echo -e "\n"

echo "✅ Tests des webhooks terminés!"
echo "Vérifiez les logs dans Supabase Dashboard pour confirmer les intégrations."
echo ""
echo "📋 Prochaines étapes:"
echo "1. Configurer les variables d'environnement"
echo "2. Déployer les Edge Functions"
echo "3. Tester en environnement staging"
echo "4. Valider les workflows n8n"
echo "5. Configurer le monitoring de production"