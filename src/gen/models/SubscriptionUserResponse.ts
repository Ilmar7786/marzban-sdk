import type { NextPlanModel } from './NextPlanModel.ts'
import type { UserDataLimitResetStrategy } from './UserDataLimitResetStrategy.ts'
import type { UserStatus } from './UserStatus.ts'

export type SubscriptionUserResponse = {
  /**
   * @type object
   */
  proxies: object
  expire?: (number | null) | null
  /**
   * @description data_limit can be 0 or greater
   */
  data_limit?: number | null
  /**
   * @type string | undefined
   */
  data_limit_reset_strategy?: UserDataLimitResetStrategy
  sub_updated_at?: (string | null) | null
  sub_last_user_agent?: (string | null) | null
  online_at?: (string | null) | null
  on_hold_expire_duration?: (number | null) | null
  on_hold_timeout?: (string | null) | null
  next_plan?: (NextPlanModel | null) | null
  /**
   * @type string
   */
  username: string
  /**
   * @type string
   */
  status: UserStatus
  /**
   * @type integer
   */
  used_traffic: number
  /**
   * @default 0
   * @type integer | undefined
   */
  lifetime_used_traffic?: number
  /**
   * @type string, date-time
   */
  created_at: string
  /**
   * @type array | undefined
   */
  links?: string[]
  /**
   * @default ""
   * @type string | undefined
   */
  subscription_url?: string
}
