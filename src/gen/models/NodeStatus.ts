export const nodeStatusEnum = {
  connected: 'connected',
  connecting: 'connecting',
  error: 'error',
  disabled: 'disabled',
} as const

export type NodeStatusEnum = (typeof nodeStatusEnum)[keyof typeof nodeStatusEnum]

export type NodeStatus = NodeStatusEnum
