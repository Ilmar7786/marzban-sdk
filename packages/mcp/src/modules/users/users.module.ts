import {
  usersActivateTool,
  usersCreateTool,
  usersDeactivateTool,
  usersDeleteTool,
  usersExtendTool,
  usersGetTool,
  usersHoldTool,
  usersListTool,
  usersResetTrafficTool,
  usersUpdateTool,
  usersUsageTool,
} from './users.tools'

export const usersModule = [
  usersListTool,
  usersGetTool,
  usersCreateTool,
  usersUpdateTool,
  usersActivateTool,
  usersDeactivateTool,
  usersHoldTool,
  usersExtendTool,
  usersUsageTool,
  usersDeleteTool,
  usersResetTrafficTool,
]
