'use client'

import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { type ComponentProps, createContext, type MouseEvent, type ReactNode, useContext, useState } from 'react'

import { typeGlossary, typeNamePattern } from './type-glossary'

/**
 * When true, inline code is rendered verbatim and type names are NOT turned
 * into popovers. Headings opt in so a type's own definition heading stays a
 * plain heading instead of linking to itself.
 */
const PlainCodeContext = createContext(false)

/**
 * Inline, click-to-open reference for an SDK type name. Renders the type name
 * styled as part of the surrounding code, with a popover describing it and a
 * link to its full definition — so readers don't have to jump between pages.
 */
function TypeRef({ name }: { name: string }) {
  const info = typeGlossary[name]
  const [open, setOpen] = useState(false)
  if (!info) return name

  const loose = info.kind === 'loose'

  function handleNavigate(event: MouseEvent<HTMLAnchorElement>) {
    // Always close the popover on click.
    setOpen(false)

    // If the target heading lives on the current page, scroll to it manually:
    // a normal anchor link won't re-scroll when the URL hash already matches,
    // which breaks repeat clicks on the same type. Cross-page links fall
    // through to default navigation.
    const hash = info!.href?.split('#')[1]
    const target = hash ? document.getElementById(hash) : null
    if (target) {
      event.preventDefault()
      target.scrollIntoView({ behavior: 'smooth' })
      window.history.replaceState(null, '', `#${hash}`)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={loose ? 'type-ref-trigger type-ref-trigger--loose' : 'type-ref-trigger'}>
        {name}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 text-left">
        <p className="flex items-center gap-1.5 font-mono text-sm font-semibold text-fd-foreground">
          {name}
          {loose && (
            <span className="rounded bg-fd-muted px-1.5 py-0.5 font-sans text-[0.65rem] font-medium tracking-wide text-fd-muted-foreground uppercase">
              dynamic
            </span>
          )}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-fd-muted-foreground">{info.description}</p>
        {info.href && (
          <Link
            href={info.href}
            onClick={handleNavigate}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-fd-primary hover:underline"
          >
            View full definition
            <ArrowUpRight className="size-3.5" />
          </Link>
        )}
      </PopoverContent>
    </Popover>
  )
}

/**
 * Inline-code renderer that turns any known SDK type name (see `typeGlossary`)
 * into a reference popover, while leaving everything else untouched.
 *
 * Only plain-string inline code is processed: highlighted code blocks pass
 * their inner `code` children as element arrays, and headings disable it via
 * `PlainCodeContext`, so both fall straight through to a native `<code>`.
 */
export function InlineCode({ children, ...props }: ComponentProps<'code'>) {
  const plain = useContext(PlainCodeContext)

  if (plain || typeof children !== 'string') {
    return <code {...props}>{children}</code>
  }

  const text = children
  const parts: ReactNode[] = []
  let last = 0

  for (const match of text.matchAll(typeNamePattern)) {
    const start = match.index
    const name = match[0]
    if (start > last) parts.push(text.slice(last, start))
    parts.push(<TypeRef key={start} name={name} />)
    last = start + name.length
  }

  if (last === 0) return <code {...props}>{text}</code>
  if (last < text.length) parts.push(text.slice(last))

  return <code {...props}>{parts}</code>
}

/**
 * Renders children with type popovers disabled. Wrap a heading component with
 * this so a type's own definition heading stays a plain heading (and keeps its
 * native Fumadocs anchor + copy controls) instead of linking to itself.
 */
export function PlainCode({ children }: { children: ReactNode }) {
  return <PlainCodeContext.Provider value>{children}</PlainCodeContext.Provider>
}
