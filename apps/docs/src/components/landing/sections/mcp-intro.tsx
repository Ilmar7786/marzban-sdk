import { CodePreview } from '@/components/landing/code-preview'
import { GridBackdrop } from '@/components/landing/grid-backdrop'
import { SectionHeader } from '@/components/landing/section-header'
import { mcpSample } from '@/config/landing/code-samples'
import { mcpDockerImage, mcpNpmPackage } from '@/lib/shared'

export function McpIntro() {
  return (
    <section className="relative overflow-hidden border-t border-fd-border">
      <GridBackdrop maskSize="60% 60%" />
      <div className="relative mx-auto w-full max-w-4xl px-4 py-20">
        <div className="mb-7">
          <SectionHeader
            eyebrow="marzban-mcp"
            title={
              <>
                Or hand your panel to <span className="brand-gradient-text">an AI agent</span>
              </>
            }
            lead="Point Claude, Cursor, or any MCP client at your panel with one config block — no custom integration code, built on the same SDK above."
          />
        </div>
        <CodePreview code={mcpSample} lang="json" title="claude_desktop_config.json" />
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm text-fd-muted-foreground">
          <a
            href={`https://www.npmjs.com/package/${mcpNpmPackage}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-fd-border bg-fd-card px-3 py-1 hover:bg-fd-accent"
          >
            npx -y {mcpNpmPackage}
          </a>
          <a
            href={`https://hub.docker.com/r/${mcpDockerImage}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-fd-border bg-fd-card px-3 py-1 hover:bg-fd-accent"
          >
            docker pull {mcpDockerImage}
          </a>
        </div>
      </div>
    </section>
  )
}
