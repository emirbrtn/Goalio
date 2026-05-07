#!/bin/sh
set -eu

PROJECT_NAME="${COMPOSE_PROJECT_NAME:-goalio-ci}"
NETWORK_NAME="${PROJECT_NAME}_default"

echo "Checking backend health endpoint..."
docker run --rm --network "${NETWORK_NAME}" alpine:3.20 \
  sh -c "wget -qO- http://backend:5000/ | grep 'Goalio API aktif'"

echo "Checking frontend home page..."
docker run --rm --network "${NETWORK_NAME}" alpine:3.20 \
  sh -c "wget -qO- http://frontend:3000/ | grep -i '<html'"

echo "Smoke tests passed."
