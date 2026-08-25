import { GithubMark } from '@/components/ui/github-mark'
import { gitConfig } from '@/lib/shared'

/** "Star on GitHub" CTA, used in both the hero and the final CTA section. */
export function GithubStarLink() {
  return (
    <a
      href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-fd-border bg-fd-card px-5 py-2.5 font-medium transition-colors hover:bg-fd-accent"
    >
      <GithubMark className="size-4" />
      Star on GitHub
    </a>
  )
}
