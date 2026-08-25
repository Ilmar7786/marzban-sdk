import { Star } from 'lucide-react'

import { GithubMark } from '@/components/ui/github-mark'
import { gitConfig } from '@/lib/shared'

async function fetchStars(): Promise<number | null> {
  try {
    // No `next: { revalidate }` — this site is a static export (see
    // `.github/workflows/docs.yml`), which has no server to run ISR. This
    // fetch runs once per build; the star count only ever refreshes on the
    // next deploy, which the workflow's `schedule` trigger does periodically.
    const res = await fetch(`https://api.github.com/repos/${gitConfig.user}/${gitConfig.repo}`, {
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
