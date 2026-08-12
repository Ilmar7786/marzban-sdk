import {
  usersActivateTool,
  usersCreateTool,
  usersDeactivateTool,
  usersExtendTool,
  usersGetTool,
  usersHoldTool,
  usersListTool,
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
]
