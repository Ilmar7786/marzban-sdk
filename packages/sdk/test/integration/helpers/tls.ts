import { readFileSync } from 'node:fs'
import https from 'node:https'
import path from 'node:path'

// local/marzban/gen-cert.sh generates a self-signed cert (with a
// `127.0.0.1` SAN) for the panel `pnpm local:up` starts. Trusting it here —
// via the SDK's own `httpsAgent` config option — replaces the
// NODE_TLS_REJECT_UNAUTHORIZED=0 escape hatch this suite used to rely on;
// see docs/marzban-quirks.md.
const LOCAL_CERT_PATH = path.resolve(import.meta.dirname, '../../../../../local/marzban/data/certs/local.crt')

let localCa: Buffer | undefined | null = null

function readLocalCa(): Buffer | undefined {
  if (localCa === null) {
    try {
      localCa = readFileSync(LOCAL_CERT_PATH)
    } catch {
      // MARZBAN_BASE_URL points at some other panel — trust the system CA
      // store instead of this repo's throwaway local one.
      localCa = undefined
    }
  }
  return localCa
}

/**
 * A one-off `https.Agent` trusting the local panel's self-signed CA when
 * present (`undefined` otherwise, so the SDK falls back to its normal
 * behavior). Call fresh each time you need one — most call sites should
 * share a single instance via {@link createTestSdk}; `freshConnectionConfig`
 * in quirks.ts is the exception, needing a genuinely new connection per call.
 */
export function tlsAgent(): https.Agent | undefined {
  const ca = readLocalCa()
  return ca ? new https.Agent({ ca }) : undefined
}
