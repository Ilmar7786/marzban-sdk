import { activateAllDisabledUsers } from './activateAllDisabledUsers.ts'
import { adminToken } from './adminToken.ts'
import { createAdmin } from './createAdmin.ts'
import { disableAllActiveUsers } from './disableAllActiveUsers.ts'
import { getAdmins } from './getAdmins.ts'
import { getAdminUsage } from './getAdminUsage.ts'
import { getCurrentAdmin } from './getCurrentAdmin.ts'
import { modifyAdmin } from './modifyAdmin.ts'
import { removeAdmin } from './removeAdmin.ts'
import { resetAdminUsage } from './resetAdminUsage.ts'

export function adminApi() {
  return {
    adminToken,
    getCurrentAdmin,
    createAdmin,
    modifyAdmin,
    removeAdmin,
    getAdmins,
    disableAllActiveUsers,
    activateAllDisabledUsers,
    resetAdminUsage,
    getAdminUsage,
  }
}
