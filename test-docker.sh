#!/bin/bash
echo "🧪 Testing Docker setup..."
docker-compose down
docker-compose up --build -d
sleep 10
curl -f http://localhost:3000/api/health
echo ""
echo "✅ If you see a JSON response, it's working!"
docker-compose down
