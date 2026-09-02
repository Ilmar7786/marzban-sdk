import { Accordion, Accordions } from 'fumadocs-ui/components/accordion'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import { ExternalLink } from 'lucide-react'

import { getChangelog } from '@/lib/changelog'

/** Renders one package's releases, newest first, straight from its git-cliff CHANGELOG.md. */
function PackageReleases({ releases }: { releases: ReturnType<typeof getChangelog>[number]['releases'] }) {
  return (
    <Accordions type="single" defaultValue={releases[0]?.version}>
      {releases.map(release => (
        <Accordion
          key={release.version}
          value={release.version}
          title={
            <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <span className="font-mono text-[15px] font-semibold text-fd-foreground">v{release.displayVersion}</span>
              {release.date && <span className="text-xs text-fd-muted-foreground">{release.date}</span>}
            </span>
          }
        >
          <div className="flex flex-col gap-4">
            {release.groups.map(group => (
              <div key={group.title}>
                <h4 className="mb-1.5 text-xs font-semibold tracking-wide text-fd-muted-foreground uppercase">
                  {group.title}
                </h4>
                <ul className="flex flex-col gap-1">
                  {group.entries.map((entry, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-sm text-fd-foreground">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-fd-muted-foreground/50" />
                      <span>
                        {entry.text}
                        {entry.prNumber && entry.prUrl && (
                          <>
                            {' '}
                            <a
                              href={entry.prUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-fd-primary no-underline hover:underline"
                            >
                              #{entry.prNumber}
                            </a>
                          </>
                        )}
                        {entry.sha && entry.commitUrl && (
                          <>
                            {' '}
                            <a
                              href={entry.commitUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-[0.8em] text-fd-muted-foreground no-underline hover:text-fd-primary hover:underline"
                            >
                              {entry.sha}
                            </a>
                          </>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {release.compareUrl && (
              <a
                href={release.compareUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-1 text-xs font-medium text-fd-muted-foreground no-underline hover:text-fd-primary hover:underline"
              >
                Compare on GitHub <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </Accordion>
      ))}
    </Accordions>
  )
}

/**
 * Release history read straight from packages/*\/CHANGELOG.md — the same
 * git-cliff output that ships in each npm package and becomes each GitHub
 * Release's notes, so this page can't drift from them the way hand-written
 * prose could. What gets left out of a changelog is decided once, in
 * cliff.toml, not here — see the note at the top of lib/changelog.ts.
 */
export function ChangelogViewer() {
  const packages = getChangelog()

  if (packages.length === 1) return <PackageReleases releases={packages[0].releases} />

  return (
    <Tabs items={packages.map(pkg => pkg.label)}>
      {packages.map(pkg => (
        <Tab key={pkg.id} value={pkg.label}>
          <PackageReleases releases={pkg.releases} />
        </Tab>
      ))}
    </Tabs>
  )
}
