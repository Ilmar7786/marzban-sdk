import { readFileSync } from 'node:fs'
import https from 'node:https'
import path from 'node:path'

// Mirrors packages/sdk/test/integration/helpers/tls.ts — see that file's
// comments. Duplicated rather than shared: this suite builds its SDK
// instance directly via `createMarzbanSDK` from the published `marzban-sdk`
// entry point, bypassing MCP's own MARZBAN_TLS_CA_FILE env wiring
// (core/sdk-client.ts), so it needs its own local-cert lookup too.
const LOCAL_CERT_PATH = path.resolve(import.meta.dirname, '../../../../../local/marzban/data/certs/local.crt')

let localCa: Buffer | undefined | null = null

function readLocalCa(): Buffer | undefined {
  if (localCa === null) {
    try {
      localCa = readFileSync(LOCAL_CERT_PATH)
    } catch {
      localCa = undefined
    }
  }
  return localCa
}

/** A one-off `https.Agent` trusting the local panel's self-signed CA when present. */
export function tlsAgent(): https.Agent | undefined {
  const ca = readLocalCa()
  return ca ? new https.Agent({ ca }) : undefined
}
