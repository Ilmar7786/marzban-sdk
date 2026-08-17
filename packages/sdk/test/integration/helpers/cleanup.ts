import { randomUUID } from 'node:crypto'

/** Unique per-run prefix so a crashed run's leftovers are identifiable (and never collide with a concurrent run). */
export function uniqueTestName(prefix: string): string {
  return `sdk-it-${prefix}-${randomUUID().slice(0, 8)}`
}

/**
 * Runs cleanup functions in LIFO order, swallowing individual failures (e.g.
 * "already deleted" from an earlier assertion in the same test) so one
 * failed cleanup doesn't prevent the rest from running.
 */
export function createCleanupRegistry() {
  const cleanups: Array<() => Promise<unknown>> = []

  return {
    register(fn: () => Promise<unknown>): void {
      cleanups.push(fn)
    },
    async runAll(): Promise<void> {
      while (cleanups.length > 0) {
        const fn = cleanups.pop()!
        await fn().catch(() => undefined)
      }
    },
  }
}
