export const withTimeout = async <T>(promise: Promise<T>, ms?: number): Promise<T> => {
  if (!ms || ms <= 0) return promise
  let timeout: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error('Plugin hook timeout')), ms)
  })
  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore timeout is definitely assigned before use
    clearTimeout(timeout)
  }
}

export const safeCall = async <T>(
  fn: () => Promise<T> | T
): Promise<{ ok: true; value: T } | { ok: false; error: unknown }> => {
  try {
    const value = await fn()
    return { ok: true, value }
  } catch (error) {
    return { ok: false, error }
  }
}
