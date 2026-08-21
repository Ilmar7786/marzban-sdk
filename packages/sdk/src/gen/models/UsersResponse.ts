import type { UserResponse } from './UserResponse.ts'

/**
 * UsersResponse
 */
export type UsersResponse = {
  /**
   * @type array
   */
  users: UserResponse[]
  /**
   * @type integer
   */
  total: number
}
