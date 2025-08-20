import type { NodeStatus } from './NodeStatus.ts'

export type NodeResponse = {
  /**
   * @type string
   */
  name: string
  /**
   * @type string
   */
  address: string
  /**
   * @default 62050
   * @type integer | undefined
   */
  port?: number
  /**
   * @default 62051
   * @type integer | undefined
   */
  api_port?: number
  /**
   * @default 1
   * @type number | undefined
   */
  usage_coefficient?: number
  /**
   * @type integer
   */
  id: number
  xray_version?: string | null
  /**
   * @type string
   */
  status: NodeStatus
  message?: string | null
}
