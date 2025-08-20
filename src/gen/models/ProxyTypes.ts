export const proxyTypesEnum = {
  vmess: 'vmess',
  vless: 'vless',
  trojan: 'trojan',
  shadowsocks: 'shadowsocks',
} as const

export type ProxyTypesEnum = (typeof proxyTypesEnum)[keyof typeof proxyTypesEnum]

export type ProxyTypes = ProxyTypesEnum
