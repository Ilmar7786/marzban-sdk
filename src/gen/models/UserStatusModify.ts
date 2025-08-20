export const userStatusModifyEnum = {
  active: 'active',
  disabled: 'disabled',
  on_hold: 'on_hold',
} as const

export type UserStatusModifyEnum = (typeof userStatusModifyEnum)[keyof typeof userStatusModifyEnum]

export type UserStatusModify = UserStatusModifyEnum
