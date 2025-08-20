export const userStatusEnum = {
  active: 'active',
  disabled: 'disabled',
  limited: 'limited',
  expired: 'expired',
  on_hold: 'on_hold',
} as const

export type UserStatusEnum = (typeof userStatusEnum)[keyof typeof userStatusEnum]

export type UserStatus = UserStatusEnum
