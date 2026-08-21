export const proxyHostSecurityEnum = {
  inbound_default: 'inbound_default',
  none: 'none',
  tls: 'tls',
} as const

export type ProxyHostSecurityEnumKey = (typeof proxyHostSecurityEnum)[keyof typeof proxyHostSecurityEnum]

/**
 * ProxyHostSecurity
 */
export type ProxyHostSecurity = ProxyHostSecurityEnumKey
