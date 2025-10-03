#!/bin/bash

API_URL="http://localhost:3001/api"

echo "=== Testing Nobilis MES API ==="

# Test health/root
echo -e "\n1. Testing API root..."
curl -s http://localhost:3001/ || echo "Root endpoint not available"

# Login
echo -e "\n2. Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "1234"}')

echo "Login response: $LOGIN_RESPONSE"

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')

if [ ! -z "$TOKEN" ]; then
  echo -e "\nLogin successful! Token received."
  
  # Get users
  echo -e "\n3. Getting all users..."
  curl -s -X GET $API_URL/users \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" | python3 -m json.tool
else
  echo "Login failed! Check your backend logs."
fi

echo -e "\n=== Test complete ==="
echo "Swagger UI available at: http://localhost:3001/swagger"
