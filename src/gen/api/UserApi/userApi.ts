import { activeNextPlan } from './activeNextPlan.ts'
import { addUser } from './addUser.ts'
import { deleteExpiredUsers } from './deleteExpiredUsers.ts'
import { getExpiredUsers } from './getExpiredUsers.ts'
import { getUser } from './getUser.ts'
import { getUsers } from './getUsers.ts'
import { getUsersUsage } from './getUsersUsage.ts'
import { getUserUsage } from './getUserUsage.ts'
import { modifyUser } from './modifyUser.ts'
import { removeUser } from './removeUser.ts'
import { resetUserDataUsage } from './resetUserDataUsage.ts'
import { resetUsersDataUsage } from './resetUsersDataUsage.ts'
import { revokeUserSubscription } from './revokeUserSubscription.ts'
import { setOwner } from './setOwner.ts'

export function userApi() {
  return {
    addUser,
    getUser,
    modifyUser,
    removeUser,
    resetUserDataUsage,
    revokeUserSubscription,
    getUsers,
    resetUsersDataUsage,
    getUserUsage,
    activeNextPlan,
    getUsersUsage,
    setOwner,
    getExpiredUsers,
    deleteExpiredUsers,
  }
}
