export const userStatusCreateEnum = {
  active: 'active',
  on_hold: 'on_hold',
} as const

export type UserStatusCreateEnum = (typeof userStatusCreateEnum)[keyof typeof userStatusCreateEnum]

export type UserStatusCreate = UserStatusCreateEnum
