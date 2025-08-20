import type { ProxyHostALPN } from './ProxyHostALPN.ts'
import type { ProxyHostFingerprint } from './ProxyHostFingerprint.ts'
import type { ProxyHostSecurity } from './ProxyHostSecurity.ts'

export type ProxyHost = {
  /**
   * @type string
   */
  remark: string
  /**
   * @type string
   */
  address: string
  port?: (number | null) | null
  sni?: (string | null) | null
  host?: (string | null) | null
  path?: (string | null) | null
  /**
   * @type string | undefined
   */
  security?: ProxyHostSecurity
  /**
   * @type string | undefined
   */
  alpn?: ProxyHostALPN
  /**
   * @type string | undefined
   */
  fingerprint?: ProxyHostFingerprint
  allowinsecure?: boolean | null
  is_disabled?: boolean | null
  mux_enable?: boolean | null
  fragment_setting?: (string | null) | null
  noise_setting?: (string | null) | null
  random_user_agent?: boolean | null
  use_sni_as_host?: boolean | null
}
