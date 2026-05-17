#!/bin/sh
set -eu

PROJECT_NAME="${COMPOSE_PROJECT_NAME:-goalio-ci}"
NETWORK_NAME="${PROJECT_NAME}_default"
MAX_ATTEMPTS="${SMOKE_MAX_ATTEMPTS:-12}"
SLEEP_SECONDS="${SMOKE_SLEEP_SECONDS:-5}"

retry_check() {
  description="$1"
  command="$2"
  attempt=1

  while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
    echo "${description} (attempt ${attempt}/${MAX_ATTEMPTS})..."
    if sh -c "$command"; then
      return 0
    fi

    if [ "$attempt" -eq "$MAX_ATTEMPTS" ]; then
      echo "${description} failed after ${MAX_ATTEMPTS} attempts."
      return 1
    fi

    attempt=$((attempt + 1))
    sleep "$SLEEP_SECONDS"
  done
}

retry_check \
  "Checking backend health endpoint" \
  "docker run --rm --network \"${NETWORK_NAME}\" alpine:3.20 sh -c \"wget -qO- http://backend:5000/ | grep 'Goalio API aktif'\""

echo "Checking redis availability..."
docker run --rm --network "${NETWORK_NAME}" redis:7.2-alpine \
  redis-cli -h redis ping | grep PONG

echo "Checking rabbitmq availability..."
docker run --rm --network "${NETWORK_NAME}" rabbitmq:3-management \
  rabbitmq-diagnostics -n rabbit@rabbitmq -q ping

retry_check \
  "Checking frontend home page" \
  "docker run --rm --network \"${NETWORK_NAME}\" alpine:3.20 sh -c \"wget -qO- http://frontend:3000/ | grep -i '<html'\""

echo "Smoke tests passed."
