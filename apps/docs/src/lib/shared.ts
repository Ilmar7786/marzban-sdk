export const appName = 'MarzbanSDK'
export const docsRoute = '/docs'
export const docsImageRoute = '/og/docs'
export const docsContentRoute = '/llms.mdx/docs'

export const gitConfig = {
  user: 'Ilmar7786',
  repo: 'marzban-sdk',
  branch: 'main',
}

export const npmPackage = 'marzban-sdk'

/**
 * Deployment base path. GitHub Pages serves a project site from
 * `https://<user>.github.io/<repo>`, so every internal URL is prefixed in
 * production. Kept in sync with `next.config.mjs` and overridable for a custom
 * domain via `NEXT_PUBLIC_BASE_PATH=''`.
 */
export const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ?? (process.env.NODE_ENV === 'production' ? '/marzban-sdk' : '')

/**
 * Absolute origin (including any base path) used as the SEO `metadataBase` and
 * for building canonical / sitemap URLs. Override with `NEXT_PUBLIC_SITE_URL`
 * when serving from a custom domain.
 */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ilmar7786.github.io/marzban-sdk'

/**
 * Prefix a root-relative path with the deployment base path.
 *
 * Metadata URL strings are resolved by Next against `metadataBase`, but a
 * leading-slash path replaces the base's whole path — silently dropping the
 * `/marzban-sdk` segment. Routing-aware `<Link>`s get the base path injected
 * automatically, but raw `fetch`/metadata strings do not, so build them here.
 */
export function withBasePath(path: string): string {
  return `${basePath}${path}`
}
