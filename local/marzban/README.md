# Local Marzban panel (manual testing)

Part of [`local/`](../README.md) — see that file for how this fits alongside
other dev stacks. A throwaway [Marzban](https://github.com/Gozargah/Marzban)
panel in Docker, for manually exercising `marzban-sdk` and `marzban-mcp`
against a real panel. Not part of the automated test suite — see the
"Network isolation" section of [`docs/testing.md`](../../docs/testing.md).

The panel is served over HTTPS with a self-signed certificate — required for
it to bind at all inside the container (see "Ports" below).

## Quick start

```sh
cp local/marzban/.env.example local/marzban/.env   # edit SUDO_USERNAME/SUDO_PASSWORD if you want
pnpm local:up
pnpm local:logs    # wait for it to report ready, then Ctrl+C
```

Panel is now at `https://127.0.0.1:8000` (self-signed — `curl -k`, or accept
the browser warning), Swagger at `https://127.0.0.1:8000/docs`. Log in with
the `SUDO_USERNAME`/`SUDO_PASSWORD` from your `.env` — Marzban creates that
sudo admin from those env vars on first boot.

## Managing it

```sh
pnpm local:up      # generate a cert if missing, then start (or recreate after a config change)
pnpm local:logs    # follow logs
pnpm local:down    # stop and remove the container (data kept)
pnpm local:reset   # stop, then wipe ./data — full reset: DB, cert, Xray templates gone
```

Equivalent raw commands (run from `local/marzban/`) if you need more control —
`docker compose ps`, `docker compose restart`, `docker compose pull && docker compose up -d`
to update the image, etc.

State (SQLite DB, the self-signed cert, Xray templates) lives in `./data`,
bind-mounted to `/var/lib/marzban` — gitignored, inspect it directly if
something looks wrong, or run `pnpm local:reset` for a clean slate.

## Pointing the SDK / MCP at it

The panel's certificate is self-signed — configure your client to trust it
or skip verification accordingly.

**SDK**, in a scratch script or REPL:

```ts
import { createMarzbanSDK } from 'marzban-sdk'

const sdk = await createMarzbanSDK({
  baseUrl: 'https://127.0.0.1:8000',
  username: 'admin',
  password: 'changeme-local-only',
})
```

**MCP**, in your client's MCP config (see
[`packages/mcp/README.md`](../../packages/mcp/README.md)):

```json
{
  "mcpServers": {
    "marzban-local": {
      "command": "npx",
      "args": ["-y", "marzban-mcp"],
      "env": {
        "MARZBAN_BASE_URL": "https://127.0.0.1:8000",
        "MARZBAN_USERNAME": "admin",
        "MARZBAN_PASSWORD": "changeme-local-only",
        "MARZBAN_MCP_PROFILE": "full"
      }
    }
  }
}
```

Use a name like `marzban-local` (not `marzban`) so it's never ambiguous with
a real-panel entry sitting in the same client config. `profile: full` is
what unlocks the destructive tools this panel exists to let you exercise
safely — don't set that against a real panel.

## Ports

- The panel publishes `127.0.0.1:${MARZBAN_LOCAL_PORT:-8000}` — loopback
  only, not reachable from your LAN. Change `MARZBAN_LOCAL_PORT` in `.env`
  if 8000 is taken locally.
- The bundled Xray config (`xray_config.json` in the image) ships one
  placeholder inbound — Shadowsocks on port **1080**, `clients: []` — but
  since only port 8000 is published, that port never reaches the host.
- Nothing in this stack is configured to use 80 or 443, and it never touches
  the host's network stack directly, so there's no path by which it could
  collide with a production Marzban's inbounds on those ports even if that
  panel happens to be running on the same machine.
- Without a configured SSL certificate, Marzban binds only to its own
  container's loopback interface, unreachable through Docker's port
  publishing on any networking mode. `gen-cert.sh` (run automatically by
  `pnpm local:up`) generates a self-signed certificate for this;
  `UVICORN_SSL_CA_TYPE=private` is Marzban's supported setting for a
  self-signed cert in this situation.

## Things to know

- **User creation needs at least one Xray inbound configured.** The image
  ships a default `xray_config.json` with example inbounds, which is enough
  for CRUD/API testing. If you replace the Xray config via the panel and
  remove all inbounds, user-creation calls will start failing — that's
  Marzban behavior, not an SDK bug.
- **`DEBUG=True` is incompatible with this image.** It makes the app shell
  out to `npm run dev` for the dashboard frontend on startup, and the image
  has no `npm` — the container crash-loops. `DOCS=True` (Swagger/Redoc at
  `/docs`, `/redoc`) is unrelated and fine to leave on.
- **The cert persists in `./data/certs/`** across `pnpm local:down`/`local:up`
  — `gen-cert.sh` only regenerates it if missing. `pnpm local:reset` deletes
  it along with everything else; the next `local:up` makes a fresh one.
- **SQLite, single container, no HA** — fine for manual testing, not
  representative of a production Postgres/MySQL setup if you're debugging
  something DB-specific.
- **Credentials here are intentionally weak** (`changeme-local-only`) and
  the panel is loopback-only — don't read the weak password as reducing
  safety; the real boundary is that nothing here is reachable off `127.0.0.1`.
