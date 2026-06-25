import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'

import { InlineCode, PlainCode } from './type-ref'

/** Heading tags whose inline code should render plainly (no type popovers). */
const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const

/**
 * Wrap Fumadocs' default heading components so inline code inside a heading
 * isn't turned into a type popover — keeping each type's definition heading a
 * plain heading, while preserving Fumadocs' anchor and copy controls.
 */
const headingComponents = Object.fromEntries(
  headingTags
    .filter(tag => defaultMdxComponents[tag])
    .map(tag => {
      const Heading = defaultMdxComponents[tag] as React.ComponentType<Record<string, unknown>>
      return [
        tag,
        (props: Record<string, unknown>) => (
          <PlainCode>
            <Heading {...props} />
          </PlainCode>
        ),
      ]
    })
) as MDXComponents

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ...headingComponents,
    code: InlineCode,
    Tab,
    Tabs,
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
