export interface TtlMap<V> {
  /** The stored value, or `undefined` when the key was never set or its entry has expired. */
  get(key: string): V | undefined
  set(key: string, value: V, ttlMs: number): void
  delete(key: string): void
  /** Live entries only — expired ones are swept before counting. */
  readonly size: number
}

export interface TtlMapOptions {
  /** Hard cap on live entries; the oldest insertion is evicted when a new key would exceed it. Omit for no cap. */
  maxEntries?: number
}

/**
 * A `Map` whose entries expire, sweeping on access rather than on a timer.
 *
 * The no-timer part is deliberate, not an optimization: a `setInterval` keeps
 * the Node event loop alive, and this server talks stdio — a lingering timer
 * turns a clean exit into a hang. Every read and write pays for one sweep of
 * the (small, TTL-bounded) map instead.
 *
 * `maxEntries` bounds memory for a long-lived process: without it, a loop over
 * ten thousand usernames retains ten thousand entries until their TTLs pass.
 * Eviction is oldest-insertion-first, which `Map`'s iteration order gives for
 * free.
 */
export function createTtlMap<V>(options: TtlMapOptions = {}): TtlMap<V> {
  const entries = new Map<string, { value: V; expiresAt: number }>()
  const { maxEntries } = options

  function sweep(now: number): void {
    for (const [key, entry] of entries) {
      if (entry.expiresAt <= now) entries.delete(key)
    }
  }

  return {
    get(key) {
      sweep(Date.now())
      return entries.get(key)?.value
    },

    set(key, value, ttlMs) {
      const now = Date.now()
      sweep(now)
      // Delete first so a re-set moves the key to the end of the insertion
      // order — otherwise a refreshed entry would still be evicted as if it
      // were the oldest one.
      entries.delete(key)
      if (maxEntries !== undefined) {
        for (const oldest of entries.keys()) {
          if (entries.size < maxEntries) break
          entries.delete(oldest)
        }
      }
      entries.set(key, { value, expiresAt: now + ttlMs })
    },

    delete(key) {
      entries.delete(key)
    },

    get size() {
      sweep(Date.now())
      return entries.size
    },
  }
}
