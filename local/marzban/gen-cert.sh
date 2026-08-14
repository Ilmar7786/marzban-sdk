#!/usr/bin/env bash
# Generates the throwaway self-signed cert Marzban needs to bind 0.0.0.0
# inside its container (see docker-compose.yml / README.md "Ports"). Safe to
# re-run — skips generation if a cert already exists. Deleted by
# `pnpm local:reset` along with the rest of ./data.
set -euo pipefail
cd "$(dirname "$0")"

mkdir -p data/certs

if [[ -f data/certs/local.crt && -f data/certs/local.key ]]; then
  exit 0
fi

openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout data/certs/local.key -out data/certs/local.crt \
  -days 825 -subj "/CN=marzban-local" \
  >/dev/null 2>&1

echo "Generated self-signed cert at local/marzban/data/certs/"
