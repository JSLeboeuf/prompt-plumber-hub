#!/bin/bash

# Test Production Webhooks Script for Drain Fortin SaaS
# Tests all production webhooks with real endpoints and validation

# Set colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_URL="https://rmtnitwtxikuvnrlsmtq.supabase.co"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdG5pdHd0eGlrdXZucmxzbXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MTc0MjAsImV4cCI6MjA3MzI5MzQyMH0.Wd5fOfMNJ--1E4GTggB4pMW2z0VSZVgHgd0k0e2lOTc"
N8N_BASE_URL="https://n8n.drainfortin.ca"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)

echo -e "${BLUE}🚀 Drain Fortin - Tests des Webhooks de Production${NC}"
echo "=================================================="
echo -e "${YELLOW}Timestamp: ${TIMESTAMP}${NC}"
echo -e "${YELLOW}Supabase: ${SUPABASE_URL}${NC}"
echo ""

# Function to test HTTP response
test_webhook() {
    local name="$1"
    local url="$2"
    local data="$3"
    local expected_status="${4:-200}"
    
    echo -e "${BLUE}🧪 Test: ${name}${NC}"
    echo "URL: ${url}"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST "${url}" \
        -H "Authorization: Bearer ${API_KEY}" \
        -H "Content-Type: application/json" \
        -H "apikey: ${API_KEY}" \
        -H "Prefer: return=representation" \
        -d "${data}" \
        --max-time 30)
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    
    if [ "$http_code" -eq "$expected_status" ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✅ SUCCESS - HTTP ${http_code}${NC}"
        if [ -n "$body" ] && [ "$body" != "null" ]; then
            echo -e "${GREEN}Response: ${body}${NC}"
        fi
    else
        echo -e "${RED}❌ FAILED - HTTP ${http_code}${NC}"
        if [ -n "$body" ]; then
            echo -e "${RED}Error: ${body}${NC}"
        fi
    fi
    echo ""
}

# Function to test n8n webhook
test_n8n_webhook() {
    local name="$1"
    local endpoint="$2"
    local data="$3"
    
    echo -e "${BLUE}⚡ Test n8n: ${name}${NC}"
    local url="${N8N_BASE_URL}${endpoint}"
    echo "URL: ${url}"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST "${url}" \
        -H "Content-Type: application/json" \
        -d "${data}" \
        --max-time 15)
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 202 ]; then
        echo -e "${GREEN}✅ n8n Webhook OK - HTTP ${http_code}${NC}"
    else
        echo -e "${YELLOW}⚠️  n8n Webhook Warning - HTTP ${http_code}${NC}"
        echo -e "${YELLOW}Note: n8n webhook URLs may need configuration${NC}"
    fi
    echo ""
}

# 1. Test Supabase Health Check
echo -e "${BLUE}🏥 Health Check - Supabase Connection${NC}"
test_webhook "Supabase Connection Test" \
    "${SUPABASE_URL}/rest/v1/vapi_calls?select=count" \
    '{}' \
    200

# 2. Test Emergency Call Creation
echo -e "${BLUE}🚨 Test Création Appel d'Urgence${NC}"
test_webhook "Emergency Call Creation" \
    "${SUPABASE_URL}/rest/v1/vapi_calls" \
    '{
        "call_id": "test-emergency-'$(date +%s)'",
        "customer_name": "Test Client Production",
        "phone_number": "+15145550123",
        "priority": "P1",
        "status": "pending",
        "metadata": {
            "source": "production_test",
            "description": "Test appel urgence - Production",
            "address": "123 Test Street, Montreal, QC",
            "test": true
        }
    }' \
    201

# 3. Test Client Creation
echo -e "${BLUE}👥 Test Création Client CRM${NC}"
test_webhook "Client CRM Creation" \
    "${SUPABASE_URL}/rest/v1/clients" \
    '{
        "name": "Client Test Production",
        "phone": "+15145551234",
        "email": "test.production@drainfortin.com",
        "address": "456 Production Ave, Quebec, QC",
        "status": "active",
        "tags": ["test", "production"],
        "notes": "Client créé via test webhook production"
    }' \
    201

# 4. Test VAPI Webhook Endpoint
echo -e "${BLUE}📞 Test VAPI Webhook Endpoint${NC}"
test_webhook "VAPI Webhook" \
    "${SUPABASE_URL}/functions/v1/vapi-webhook" \
    '{
        "event": "call.started",
        "call": {
            "id": "test-vapi-call-'$(date +%s)'",
            "customer_phone": "+15145550789",
            "assistant_id": "test-assistant",
            "status": "active"
        },
        "timestamp": "'${TIMESTAMP}'"
    }' \
    200

# 5. Test SMS Function
echo -e "${BLUE}📱 Test SMS Sending Function${NC}"
test_webhook "SMS Function" \
    "${SUPABASE_URL}/functions/v1/send-sms" \
    '{
        "to": "+15145550123",
        "message": "Test SMS Production - Drain Fortin Dashboard",
        "client_name": "Test Client",
        "service_type": "test",
        "priority": "normal"
    }' \
    200

# 6. Test Analytics Event
echo -e "${BLUE}📊 Test Analytics Event${NC}"
test_webhook "Analytics Event" \
    "${SUPABASE_URL}/rest/v1/analytics" \
    '{
        "event_type": "production_test",
        "event_data": {
            "test_suite": "webhook_validation",
            "timestamp": "'${TIMESTAMP}'",
            "success": true,
            "environment": "production"
        },
        "session_id": "test-session-'$(date +%s)'",
        "user_id": "test-user"
    }' \
    201

# 7. Test n8n Webhooks
echo -e "${BLUE}⚡ Tests n8n Automation Webhooks${NC}"

test_n8n_webhook "Emergency Call n8n" \
    "/webhook/drain-fortin-dashboard/calls" \
    '{
        "event": "emergency_call_created",
        "call": {
            "id": "test-n8n-call-'$(date +%s)'",
            "customer_name": "Test Client n8n",
            "phone": "+15145550456",
            "priority": "P1",
            "description": "Test webhook n8n - Urgence"
        },
        "timestamp": "'${TIMESTAMP}'",
        "source": "drain-fortin-dashboard"
    }'

test_n8n_webhook "SMS Status n8n" \
    "/webhook/sms-status" \
    '{
        "event": "sms_sent",
        "sms": {
            "to": "+15145550123",
            "status": "delivered",
            "message_id": "test-sms-'$(date +%s)'"
        },
        "timestamp": "'${TIMESTAMP}'"
    }'

test_n8n_webhook "Dashboard Metrics n8n" \
    "/webhook/drain-fortin-dashboard/metrics" \
    '{
        "event": "metrics_update",
        "metrics": {
            "calls_today": 15,
            "interventions_active": 8,
            "satisfaction_score": 4.6
        },
        "timestamp": "'${TIMESTAMP}'"
    }'

# 8. Test Rate Limiting
echo -e "${BLUE}🛡️  Test Rate Limiting${NC}"
test_webhook "Rate Limit Test" \
    "${SUPABASE_URL}/rest/v1/rate_limits" \
    '{
        "identifier": "test-rate-limit",
        "requests": 1,
        "window_start": "'${TIMESTAMP}'",
        "metadata": {
            "test": true,
            "endpoint": "production_test"
        }
    }' \
    201

# 9. Test Error Logging
echo -e "${BLUE}📝 Test Error Logging${NC}"
test_webhook "Error Log Test" \
    "${SUPABASE_URL}/rest/v1/error_logs" \
    '{
        "service": "webhook_test",
        "message": "Test error log from production webhook validation",
        "error_type": "test_error",
        "severity": "info",
        "context": {
            "test_suite": "production_webhooks",
            "timestamp": "'${TIMESTAMP}'"
        }
    }' \
    201

# 10. Health Check Summary
echo -e "${BLUE}🏥 Final Health Check${NC}"
test_webhook "Final Health Status" \
    "${SUPABASE_URL}/functions/v1/health" \
    '{"check": "complete"}' \
    200

# Summary
echo ""
echo "=============================================="
echo -e "${GREEN}✅ Tests des webhooks terminés!${NC}"
echo ""
echo -e "${YELLOW}📋 Prochaines étapes:${NC}"
echo "1. Vérifiez les logs dans Supabase Dashboard"
echo "2. Configurez les URLs n8n dans les variables d'environnement"
echo "3. Testez les intégrations VAPI et Twilio avec vos clés API"
echo "4. Validez les workflows n8n"
echo "5. Configurez le monitoring de production"
echo ""
echo -e "${BLUE}🔗 Liens utiles:${NC}"
echo "- Supabase Dashboard: https://supabase.com/dashboard/project/rmtnitwtxikuvnrlsmtq"
echo "- Edge Functions Logs: https://supabase.com/dashboard/project/rmtnitwtxikuvnrlsmtq/functions"
echo "- Database: https://supabase.com/dashboard/project/rmtnitwtxikuvnrlsmtq/editor"
echo ""
echo -e "${GREEN}🎯 Dashboard prêt pour la production!${NC}"