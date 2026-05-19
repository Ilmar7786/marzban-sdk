import type { UserResponse } from './UserResponse.ts'

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
