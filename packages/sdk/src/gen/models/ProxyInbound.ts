import type { ProxyTypes } from './ProxyTypes.ts'

/**
 * ProxyInbound
 */
export type ProxyInbound = {
  /**
   * @type string
   */
  tag: string
  /**
   * @type string
   */
  protocol: ProxyTypes
  /**
   * @type string
   */
  network: string
  /**
   * @type string
   */
  tls: string
  port: number | string
}
