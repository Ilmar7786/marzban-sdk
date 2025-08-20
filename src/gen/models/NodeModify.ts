import type { NodeStatus } from './NodeStatus.ts'

/**
 * @example [object Object]
 */
export type NodeModify = {
  name?: (string | null) | null
  address?: (string | null) | null
  port?: (number | null) | null
  api_port?: (number | null) | null
  usage_coefficient?: (number | null) | null
  status?: (NodeStatus | null) | null
}
