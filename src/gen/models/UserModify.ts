import type { NextPlanModel } from './NextPlanModel.ts'
import type { ProxySettings } from './ProxySettings.ts'
import type { UserDataLimitResetStrategy } from './UserDataLimitResetStrategy.ts'
import type { UserStatusModify } from './UserStatusModify.ts'

/**
 * @example [object Object]
 */
export type UserModify = {
  /**
   * @default [object Object]
   * @type object | undefined
   */
  proxies?: {
    [key: string]: ProxySettings
  }
  expire?: (number | null) | null
  /**
   * @description data_limit can be 0 or greater
   */
  data_limit?: number | null
  /**
   * @type string | undefined
   */
  data_limit_reset_strategy?: UserDataLimitResetStrategy
  /**
   * @default [object Object]
   * @type object | undefined
   */
  inbounds?: {
    [key: string]: string[]
  }
  note?: (string | null) | null
  sub_updated_at?: (string | null) | null
  sub_last_user_agent?: (string | null) | null
  online_at?: (string | null) | null
  on_hold_expire_duration?: (number | null) | null
  on_hold_timeout?: (string | null) | null
  auto_delete_in_days?: (number | null) | null
  next_plan?: (NextPlanModel | null) | null
  /**
   * @type string | undefined
   */
  status?: UserStatusModify
}
