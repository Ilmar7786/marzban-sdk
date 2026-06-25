import { DocsLayout } from 'fumadocs-ui/layouts/docs'

import { DocsSidebarFooter } from '@/components/docs-sidebar-footer'
import { baseOptions } from '@/lib/layout.shared'
import { source } from '@/lib/source'

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...baseOptions({ navExtras: false })}
      // The footer controls (npm, GitHub, language, theme) are rendered as one
      // compact row by DocsSidebarFooter, so the built-in theme toggle is
      // disabled to avoid a duplicate.
      themeSwitch={{ enabled: false }}
      sidebar={{ footer: <DocsSidebarFooter /> }}
    >
      {children}
    </DocsLayout>
  )
}
