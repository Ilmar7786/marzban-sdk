import { getCoreConfig } from './getCoreConfig.ts'
import { getCoreStats } from './getCoreStats.ts'
import { modifyCoreConfig } from './modifyCoreConfig.ts'
import { restartCore } from './restartCore.ts'

export function coreApi() {
  return { getCoreStats, restartCore, getCoreConfig, modifyCoreConfig }
}
