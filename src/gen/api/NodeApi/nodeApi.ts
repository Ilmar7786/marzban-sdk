import { addNode } from './addNode.ts'
import { getNode } from './getNode.ts'
import { getNodes } from './getNodes.ts'
import { getNodeSettings } from './getNodeSettings.ts'
import { getUsage } from './getUsage.ts'
import { modifyNode } from './modifyNode.ts'
import { reconnectNode } from './reconnectNode.ts'
import { removeNode } from './removeNode.ts'

export function nodeApi() {
  return { getNodeSettings, addNode, getNode, modifyNode, removeNode, getNodes, reconnectNode, getUsage }
}
