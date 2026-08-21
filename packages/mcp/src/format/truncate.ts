export interface TruncateResult {
  text: string
  truncated: boolean
}

/** Enforces a character budget with an honest marker — a silently truncated list reads to a model as "this is everything". Cuts at the last full line before the budget so a row is never split mid-way. */
export function truncate(text: string, maxChars: number): TruncateResult {
  if (text.length <= maxChars) return { text, truncated: false }

  const marker = `\n… truncated (showing the first ${maxChars} of ${text.length} characters)`
  const budget = Math.max(0, maxChars - marker.length)
  let cut = text.slice(0, budget)

  const lastNewline = cut.lastIndexOf('\n')
  if (lastNewline > 0) cut = cut.slice(0, lastNewline)

  return { text: cut + marker, truncated: true }
}
