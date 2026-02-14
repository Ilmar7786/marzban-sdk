import type { ClientFn } from './client'

/**
 * Injects instance client into every API method call so multiple SDK instances don't share one global client.
 * Kubb-generated methods use (params?, config?) with config last; we only merge into last arg when args.length >= 2
 * to avoid treating single-arg params (e.g. getAdmins({ page: 1 })) as config.
 */
export function bindClientToApi<T>(api: T, client: ClientFn): T {
  const bound = {} as T
  const apiRecord = api as Record<string, (...args: unknown[]) => unknown>
  const boundRecord = bound as Record<string, (...args: unknown[]) => unknown>
  for (const key of Object.keys(apiRecord)) {
    const fn = apiRecord[key]
    boundRecord[key] = (...args: unknown[]) => {
      const hasExplicitConfig = args.length >= 2
      const last = args[args.length - 1]
      const isLastConfig = hasExplicitConfig && typeof last === 'object' && last !== null && !Array.isArray(last)
      const config = isLastConfig ? { ...(last as object), client } : { client }
      const newArgs = isLastConfig ? [...args.slice(0, -1), config] : [...args, config]
      return fn(...newArgs)
    }
  }
  return bound
}
