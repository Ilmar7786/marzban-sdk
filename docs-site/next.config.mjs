import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

// GitHub Pages project site is served from https://<user>.github.io/<repo>.
// Apply the base path only in production builds; local dev stays at root.
// Override with a custom domain by setting NEXT_PUBLIC_BASE_PATH=''.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? (process.env.NODE_ENV === 'production' ? '/marzban-sdk' : '')

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  reactStrictMode: true,
  // This is a nested project; pin the workspace root to avoid Turbopack picking
  // up the parent library's lockfile.
  turbopack: { root: import.meta.dirname },
  basePath,
  // Static export cannot use the Next.js image optimizer.
  images: { unoptimized: true },
  // Emit /docs/ instead of /docs.html so links work on static hosts.
  trailingSlash: true,
}

export default withMDX(config)
