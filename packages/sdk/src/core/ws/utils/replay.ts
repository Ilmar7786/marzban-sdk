import { z } from 'zod/v4'

import { DEFAULT_WS_REPLAY, WS_REPLAY_BUFFER_LINES } from '@/config'
import { WsOptionsError } from '@/core/errors'

export type ReplayMode = 'all' | 'dedup' | 'skip'

const replayModeSchema = z.enum(['all', 'dedup', 'skip'])

/**
 * Validates `LogOptions.replay`, defaulting to `'dedup'` — the panel
 * re-delivers up to 100 already-seen lines on every reconnect (see
 * docs/marzban-quirks.md), and `'dedup'` is what suppresses that.
 */
export const resolveReplayMode = (mode: ReplayMode = DEFAULT_WS_REPLAY): ReplayMode => {
  const { data, success, error } = replayModeSchema.safeParse(mode)

  if (!success) {
    throw new WsOptionsError(error.issues)
  }

  return data
}

export type ReplayDecision = { deliver: true; data: unknown } | { deliver: false }

export interface ReplayFilter {
  /** Arms the suppression window — called on a transport drop, never on the first connect. */
  arm(): void
  /** Decides whether `data` should reach the consumer, applying and updating the current window. */
  accept(data: unknown): ReplayDecision
}

/**
 * Filters replayed log lines after a reconnect — the panel re-seeds every
 * new connection from a shared, cursor-less buffer of its last ~100 lines
 * (docs/marzban-quirks.md), and a batching `interval > 0` joins several
 * lines into one message, so filtering has to operate per *line*, not per
 * message: the replay's batching never lines up with the live stream's.
 *
 * The window is armed only by `arm()` (a drop) and disarms itself the moment
 * genuinely new content is seen, rather than staying open indefinitely — so
 * a line that legitimately repeats (a heartbeat, `"OK"`) is never dropped
 * once the replay has actually been worked through. A hard cap
 * (`bufferLines` lines scanned while armed) forces a disarm regardless, so a
 * stream of identical lines can never hold the window open forever.
 */
export const createReplayFilter = (mode: ReplayMode, bufferLines: number = WS_REPLAY_BUFFER_LINES): ReplayFilter => {
  // Ring of the last `bufferLines` delivered lines, with counts rather than
  // a plain Set: evicting one occurrence of a line that recurs legitimately
  // must not forget every other occurrence still in the window.
  const ring: string[] = []
  const counts = new Map<string, number>()
  let armed = false
  let scannedWhileArmed = 0

  /** An empty segment is always droppable while armed; a non-empty one only if it was actually delivered before. */
  const isSuppressible = (line: string): boolean => line === '' || counts.has(line)

  const recordLine = (line: string): void => {
    if (line === '') return
    ring.push(line)
    counts.set(line, (counts.get(line) ?? 0) + 1)

    if (ring.length > bufferLines) {
      const evicted = ring.shift()!
      const remaining = counts.get(evicted)! - 1
      if (remaining <= 0) counts.delete(evicted)
      else counts.set(evicted, remaining)
    }
  }

  /** Drops the leading run of suppressible lines; the first genuinely new one disarms and passes through with the rest. */
  const acceptDedup = (lines: string[], data: string): ReplayDecision => {
    let cursor = 0
    let stayArmed = true

    for (; cursor < lines.length; cursor++) {
      if (!isSuppressible(lines[cursor]!)) {
        stayArmed = false
        break
      }
      scannedWhileArmed++
      if (scannedWhileArmed > bufferLines) {
        stayArmed = false
        cursor++
        break
      }
    }
    armed = stayArmed

    const kept = lines.slice(cursor)
    kept.forEach(recordLine)

    if (kept.length === 0) return { deliver: false }
    // Nothing dropped: return the original payload by identity, not a rejoined copy.
    return cursor === 0 ? { deliver: true, data } : { deliver: true, data: kept.join('\n') }
  }

  /** Drops the whole message if any of its lines was already delivered; the first clean message disarms. */
  const acceptSkip = (lines: string[], data: string): ReplayDecision => {
    const hasSuppressibleLine = lines.some(isSuppressible)
    scannedWhileArmed += lines.length

    if (hasSuppressibleLine && scannedWhileArmed <= bufferLines) return { deliver: false }

    armed = false
    lines.forEach(recordLine)
    return { deliver: true, data }
  }

  return {
    arm() {
      armed = true
      scannedWhileArmed = 0
    },
    accept(data) {
      if (mode === 'all') return { deliver: true, data }

      // Binary frames are uncomparable — stop suppressing rather than guess.
      if (typeof data !== 'string') {
        armed = false
        return { deliver: true, data }
      }

      const lines = data.split('\n')

      if (!armed) {
        lines.forEach(recordLine)
        return { deliver: true, data }
      }

      return mode === 'dedup' ? acceptDedup(lines, data) : acceptSkip(lines, data)
    },
  }
}
