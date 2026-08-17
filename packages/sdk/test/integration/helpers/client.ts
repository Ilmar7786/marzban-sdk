import { createMarzbanSDK, type MarzbanSDK } from '../../../src/index'
import { getIntegrationEnv } from './env'

export function createTestSdk(): Promise<MarzbanSDK> {
  const env = getIntegrationEnv()
  return createMarzbanSDK({ baseUrl: env.baseUrl, username: env.username, password: env.password, logger: false })
}
