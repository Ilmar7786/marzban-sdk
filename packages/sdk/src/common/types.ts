// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyType = any

/**
 * Structural stand-in for Node's `http.Agent`/`https.Agent` (and compatible
 * agents from packages like `https-proxy-agent`, `socks-proxy-agent`). Kept
 * structural rather than importing the real type from `node:http`/`node:https`
 * so this file — and the public `Config` it feeds — stays free of Node-only
 * types in an isomorphic SDK; every real agent implementation satisfies this
 * shape (`destroy()` is inherited from Node's `Agent` base class), while a
 * plain options object passed by mistake does not.
 *
 * @example
 * import https from 'node:https'
 * import { readFileSync } from 'node:fs'
 *
 * const httpsAgent = new https.Agent({ ca: readFileSync('ca.pem') }) // trust a self-signed CA
 * const sdk = await createMarzbanSDK({ baseUrl, username, password, httpsAgent })
 */
export interface HttpAgentLike {
  destroy(): void
}
