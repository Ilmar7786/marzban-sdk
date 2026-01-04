export const proxyHostALPNEnum = {
  h3: 'h3',
  h2: 'h2',
  'http/1.1': 'http/1.1',
  'h3,h2,http/1.1': 'h3,h2,http/1.1',
  'h3,h2': 'h3,h2',
  'h2,http/1.1': 'h2,http/1.1',
} as const

export type ProxyHostALPNEnumKey = (typeof proxyHostALPNEnum)[keyof typeof proxyHostALPNEnum]

export type ProxyHostALPN = ProxyHostALPNEnumKey
