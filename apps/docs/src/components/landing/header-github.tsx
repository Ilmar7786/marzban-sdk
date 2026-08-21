import { Star } from 'lucide-react'

import { gitConfig } from '@/lib/shared'

async function fetchStars(): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${gitConfig.user}/${gitConfig.repo}`, {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { stargazers_count: number }
    return data.stargazers_count
  } catch {
    return null
  }
}

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.13-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.23 0 4.63-2.81 5.65-5.49 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
    </svg>
  )
}

/**
 * Compact "Star on GitHub" pill for the header nav, showing the live star
 * count (baked at build time). Rendered as a server component so the count is
 * fetched once per deployment with no client-side request.
 */
export async function HeaderGithub() {
  const stars = await fetchStars()

  return (
    <a
      href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Star marzban-sdk on GitHub"
      className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-fd-accent"
    >
      <GithubMark className="size-4" />
      <span className="inline-flex items-center gap-1 text-fd-muted-foreground">
        <Star className="size-3.5 text-amber-500" fill="currentColor" />
        {stars !== null ? formatStars(stars) : '—'}
      </span>
    </a>
  )
}
