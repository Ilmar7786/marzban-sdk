export const proxyHostFingerprintEnum = {
  chrome: 'chrome',
  firefox: 'firefox',
  safari: 'safari',
  ios: 'ios',
  android: 'android',
  edge: 'edge',
  '360': '360',
  qq: 'qq',
  random: 'random',
  randomized: 'randomized',
} as const

export type ProxyHostFingerprintEnum = (typeof proxyHostFingerprintEnum)[keyof typeof proxyHostFingerprintEnum]

export type ProxyHostFingerprint = ProxyHostFingerprintEnum
