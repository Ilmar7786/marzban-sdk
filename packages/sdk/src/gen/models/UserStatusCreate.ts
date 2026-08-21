export const userStatusCreateEnum = {
  active: 'active',
  on_hold: 'on_hold',
} as const

export type UserStatusCreateEnumKey = (typeof userStatusCreateEnum)[keyof typeof userStatusCreateEnum]

/**
 * UserStatusCreate
 */
export type UserStatusCreate = UserStatusCreateEnumKey
