import { Accordion, Accordions } from 'fumadocs-ui/components/accordion'
import { Download } from 'lucide-react'

import { Tooltip } from '@/components/ui/tooltip'
import { getOpenApiMeta } from '@/lib/openapi'
import { withBasePath } from '@/lib/shared'

import { HttpMethodBadge } from './http-method-badge'

/** Read-only browser for the vendored OpenAPI spec, grouped by tag, with a download toolbar. No "Try it" — this SDK docs site documents typed methods, not live REST calls. */
export function OpenApiViewer() {
  const { version, endpointCount, patchedCount, groups } = getOpenApiMeta()

  return (
    <div className="not-prose">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-fd-border bg-fd-card p-4">
        <span className="text-sm text-fd-muted-foreground">
          v{version} · {endpointCount} endpoints ·{' '}
          <Tooltip label="Returns data affected by a fix — see Spec Patches" side="bottom" align="start">
            <span
              tabIndex={0}
              className="rounded-md bg-fd-primary/10 px-2 py-0.5 text-xs font-semibold text-fd-primary"
            >
              {patchedCount} patched
            </span>
          </Tooltip>
        </span>
        <a
          href={withBasePath('/openapi.json')}
          download
          className="cta-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium"
        >
          <Download className="size-3.5" />
          Download openapi.json
        </a>
      </div>

      {/* One `Accordions` root per group (rather than one root holding every
          group) so each tag renders as its own bordered card — a flat wall of
          section dividers reads worse than a stack of distinct cards at this
          length (7 groups). */}
      <div className="flex flex-col gap-3">
        {groups.map(group => (
          <Accordions key={group.tag} type="single">
            <Accordion value={group.tag} title={`${group.tag} · ${group.operations.length}`}>
              <div className="flex flex-col divide-y divide-fd-border">
                {group.operations.map(operation => (
                  <div
                    key={`${operation.method} ${operation.path}`}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0"
                  >
                    <HttpMethodBadge method={operation.method} />
                    <code className="min-w-0 font-mono text-[13px] text-fd-foreground">{operation.path}</code>
                    <span className="min-w-0 truncate text-[13px] text-fd-muted-foreground">{operation.summary}</span>
                    {operation.patchReason && (
                      <span className="ml-auto shrink-0 rounded-md bg-fd-primary/10 px-2 py-0.5 text-xs font-semibold text-fd-primary">
                        {operation.patchReason}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Accordion>
          </Accordions>
        ))}
      </div>
    </div>
  )
}
