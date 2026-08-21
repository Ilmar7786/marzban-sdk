import { createMarzbanSDK, type MarzbanSDK } from '../../../src/index'
import { getIntegrationEnv } from './env'

/** `credentials` overrides the env admin — used to log in as a test-fixture admin (e.g. a non-sudo one). */
export function createTestSdk(credentials?: { username: string; password: string }): Promise<MarzbanSDK> {
  const env = getIntegrationEnv()
  return createMarzbanSDK({
    baseUrl: env.baseUrl,
    username: credentials?.username ?? env.username,
    password: credentials?.password ?? env.password,
    logger: false,
  })
}
