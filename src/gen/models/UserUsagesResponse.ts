import type { UserUsageResponse } from './UserUsageResponse.ts'

/**
 * UserUsagesResponse
 */
export type UserUsagesResponse = {
  /**
   * @type string
   */
  username: string
  /**
   * @type array
   */
  usages: UserUsageResponse[]
}
