import { getHosts } from './getHosts.ts'
import { getInbounds } from './getInbounds.ts'
import { getSystemStats } from './getSystemStats.ts'
import { modifyHosts } from './modifyHosts.ts'

export function systemApi() {
  return { getSystemStats, getInbounds, getHosts, modifyHosts }
}
