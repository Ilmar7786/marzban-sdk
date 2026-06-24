import { highlight } from 'fumadocs-core/highlight'
import * as Base from 'fumadocs-ui/components/codeblock'

interface CodePreviewProps {
  code: string
  lang?: string
  title?: string
}

/**
 * Build-time syntax highlighting (Shiki) wrapped in a branded, theme-aware
 * window frame. The Shiki themes supply readable token colours; the `.code-frame`
 * surface (see global.css) gives the block a soft brand-tinted background that
 * blends into the page in both light and dark mode. Zero client-side cost.
 */
export async function CodePreview({ code, lang = 'ts', title = 'example.ts' }: CodePreviewProps) {
  const rendered = await highlight(code, {
    lang,
    components: {
      pre: props => (
        <Base.CodeBlock className="my-0 code-figure">
          <Base.Pre {...props} />
        </Base.CodeBlock>
      ),
    },
  })

  return (
    <div className="code-frame">
      <div className="code-frame-bar">
        <span className="code-frame-dot" style={{ background: '#ff5f57' }} />
        <span className="code-frame-dot" style={{ background: '#febc2e' }} />
        <span className="code-frame-dot" style={{ background: '#28c840' }} />
        <span className="ml-2 font-mono text-xs text-fd-muted-foreground">{title}</span>
      </div>
      {rendered}
    </div>
  )
}
