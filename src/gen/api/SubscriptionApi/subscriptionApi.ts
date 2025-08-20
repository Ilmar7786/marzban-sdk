import { userGetUsage } from './userGetUsage.ts'
import { userSubscription } from './userSubscription.ts'
import { userSubscriptionInfo } from './userSubscriptionInfo.ts'
import { userSubscriptionWithClientType } from './userSubscriptionWithClientType.ts'

export function subscriptionApi() {
  return { userSubscription, userSubscriptionInfo, userGetUsage, userSubscriptionWithClientType }
}
