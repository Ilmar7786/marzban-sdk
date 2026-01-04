export const proxyTypesEnum = {
  vmess: 'vmess',
  vless: 'vless',
  trojan: 'trojan',
  shadowsocks: 'shadowsocks',
} as const

export type ProxyTypesEnumKey = (typeof proxyTypesEnum)[keyof typeof proxyTypesEnum]

export type ProxyTypes = ProxyTypesEnumKey
