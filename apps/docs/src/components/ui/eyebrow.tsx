/** Small uppercase pill labelling which product a section belongs to. */
export function Eyebrow({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-fd-border bg-fd-card px-3 py-1 text-xs font-semibold tracking-wide text-fd-muted-foreground uppercase">
      {children}
    </span>
  )
}
