export const userStatusModifyEnum = {
  active: 'active',
  disabled: 'disabled',
  on_hold: 'on_hold',
} as const

export type UserStatusModifyEnumKey = (typeof userStatusModifyEnum)[keyof typeof userStatusModifyEnum]

/**
 * UserStatusModify
 */
export type UserStatusModify = UserStatusModifyEnumKey
