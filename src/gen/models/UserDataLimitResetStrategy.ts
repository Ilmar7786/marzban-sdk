export const userDataLimitResetStrategyEnum = {
  no_reset: 'no_reset',
  day: 'day',
  week: 'week',
  month: 'month',
  year: 'year',
} as const

export type UserDataLimitResetStrategyEnum =
  (typeof userDataLimitResetStrategyEnum)[keyof typeof userDataLimitResetStrategyEnum]

export type UserDataLimitResetStrategy = UserDataLimitResetStrategyEnum
