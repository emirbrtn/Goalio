#!/bin/sh
set -eu

cat > backend/.env <<EOF
PORT=${PORT:-5000}
JWT_SECRET=${JWT_SECRET:-goalio-secret}
DB_FILE=./data/db.json
MONGODB_URI=${MONGODB_URI:-mongodb://127.0.0.1:27017/goalio}
CLIENT_URL=${CLIENT_URL:-http://localhost:3000}
SPORTSMONKS_API_TOKEN=${SPORTSMONKS_API_TOKEN:-demo_token_not_set}
EOF

echo "backend/.env generated for CI."
