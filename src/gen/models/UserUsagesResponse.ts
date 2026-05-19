import type { UserUsageResponse } from './UserUsageResponse.ts'

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
