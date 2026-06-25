import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page'
import { createRelativeLink } from 'fumadocs-ui/mdx'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isValidElement, type ReactNode } from 'react'

import { getMDXComponents } from '@/components/mdx'
import { appName, gitConfig } from '@/lib/shared'
import { getPageImage, getPageMarkdownUrl, source } from '@/lib/source'

// Resolve each top-level section's title from the page tree, keyed by its first
// URL segment (e.g. `modules` → "Modules"). Used to keep SEO <title>s unique
// across sections — pages like NestJS and Next.js live under both Integrations
// and Webhooks — without changing the sidebar labels.
type TreeNode = ReturnType<typeof source.getPageTree>['children'][number]

/** Flatten a page-tree `name` (which may carry an icon element) to plain text. */
function nodeText(node: ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(nodeText).join('')
  if (isValidElement(node)) return nodeText((node.props as { children?: ReactNode }).children)
  return ''
}

function firstPageUrl(nodes: TreeNode[]): string | undefined {
  for (const node of nodes) {
    if (node.type === 'page') return node.url
    if (node.type === 'folder') {
      const url = node.index?.url ?? firstPageUrl(node.children)
      if (url) return url
    }
  }
  return undefined
}

const sectionTitleBySlug: Record<string, string> = {}
for (const node of source.getPageTree().children) {
  if (node.type !== 'folder') continue
  const segment = (node.index?.url ?? firstPageUrl(node.children))?.split('/')[2]
  const title = nodeText(node.name).trim()
  if (segment && title) sectionTitleBySlug[segment] = title
}

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDX = page.data.body
  const markdownUrl = getPageMarkdownUrl(page).url

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`}
        />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const image = getPageImage(page).url
  // `trailingSlash: true` serves pages at `/…/`, so the canonical must match.
  // Root-relative: Next applies the deployment base path to metadata URLs.
  const canonical = `${page.url}/`

  // Qualify the title with its section so cross-section pages (NestJS, Next.js)
  // don't collide. The root template appends ` · MarzbanSDK` to the <title>.
  const section = page.slugs.length > 0 ? sectionTitleBySlug[page.slugs[0]] : undefined
  const seoTitle = section ? `${page.data.title} · ${section}` : page.data.title

  return {
    title: seoTitle,
    description: page.data.description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      siteName: appName,
      url: canonical,
      locale: 'en_US',
      title: seoTitle,
      description: page.data.description,
      images: image,
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: page.data.description,
      images: image,
    },
  }
}
