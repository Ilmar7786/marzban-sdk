export const proxyHostSecurityEnum = {
  inbound_default: 'inbound_default',
  none: 'none',
  tls: 'tls',
} as const

export type ProxyHostSecurityEnum = (typeof proxyHostSecurityEnum)[keyof typeof proxyHostSecurityEnum]

export type ProxyHostSecurity = ProxyHostSecurityEnum
