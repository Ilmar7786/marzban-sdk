#!/usr/bin/env bash
# Generates the throwaway self-signed cert Marzban needs to bind 0.0.0.0
# inside its container (see docker-compose.yml / README.md "Ports"). Safe to
# re-run — skips generation if a cert already exists. Deleted by
# `pnpm local:reset` along with the rest of ./data.
#
# Requires `openssl` on PATH. On Windows, run via Git Bash or WSL.
set -euo pipefail
cd "$(dirname "$0")"

command -v openssl >/dev/null 2>&1 || {
  echo "gen-cert.sh: openssl not found on PATH (on Windows: use Git Bash or WSL)" >&2
  exit 1
}

mkdir -p data/certs

# The integration suites (and manual testing) trust this cert as a CA
# instead of turning TLS verification off — see
# test/integration/helpers/tls.ts in packages/sdk and packages/mcp — so it
# needs a SAN matching the URL they use, https://127.0.0.1:8000. Node
# rejects a CN-only cert outright. Certs made before that change have no
# SAN, so regenerate those instead of keeping them.
if [[ -f data/certs/local.crt && -f data/certs/local.key ]]; then
  # `-noout -text | grep` rather than `-ext subjectAltName`: the latter is
  # OpenSSL-only, and macOS ships LibreSSL, which lacks it and would
  # regenerate the cert on every single run.
  if openssl x509 -in data/certs/local.crt -noout -text 2>/dev/null |
    grep -A1 'Subject Alternative Name' | grep -q '127\.0\.0\.1'; then
    exit 0
  fi
  echo "gen-cert.sh: existing cert has no 127.0.0.1 SAN — regenerating." >&2
  echo "gen-cert.sh: restart the panel afterwards (pnpm local:down && pnpm local:up)." >&2
fi

# Write to temp files first so a Ctrl+C or crash mid-generation can never
# leave a partial/corrupt cert behind that the existence check above would
# then silently treat as valid on the next run.
tmp_key=$(mktemp data/certs/.local.key.XXXXXX)
tmp_crt=$(mktemp data/certs/.local.crt.XXXXXX)
trap 'rm -f "$tmp_key" "$tmp_crt"' EXIT

if ! err=$(openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout "$tmp_key" -out "$tmp_crt" \
  -days 825 -subj "/CN=marzban-local" \
  -addext "subjectAltName=DNS:localhost,DNS:marzban-local,IP:127.0.0.1" 2>&1 >/dev/null); then
  echo "gen-cert.sh: openssl failed:" >&2
  echo "$err" >&2
  exit 1
fi

chmod 600 "$tmp_key"
mv "$tmp_key" data/certs/local.key
mv "$tmp_crt" data/certs/local.crt

echo "Generated self-signed cert at local/marzban/data/certs/"
