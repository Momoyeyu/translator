#!/bin/bash
set -e

BASE_URL="${1:-http://localhost:8000}"
echo "=== Smoke Test: $BASE_URL ==="

# Health check
echo -n "Health check... "
curl -sf "$BASE_URL/health" | grep -q "ok" && echo "PASS" || { echo "FAIL"; exit 1; }

# Ready check
echo -n "Ready check... "
curl -sf "$BASE_URL/ready" | grep -q "ok" && echo "PASS" || { echo "FAIL"; exit 1; }

# Register a test user
echo -n "Register... "
REGISTER_RESP=$(curl -sf -X POST "$BASE_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "smoketest@example.com", "password": "Test123456!"}' 2>/dev/null || true)
echo "SENT"

# Try login (may need email verification in real setup)
echo -n "Login... "
LOGIN_RESP=$(curl -sf -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier": "smoketest@example.com", "password": "Test123456!"}' 2>/dev/null || true)
echo "SENT"

echo ""
echo "=== Manual verification needed for full flow ==="
echo "1. Login via frontend at http://localhost:3000"
echo "2. Create a new translation project with a test document"
echo "3. Start the pipeline and verify it progresses"
echo "4. Confirm glossary terms"
echo "5. Download the translated artifact"
echo "6. Use the chat assistant"
