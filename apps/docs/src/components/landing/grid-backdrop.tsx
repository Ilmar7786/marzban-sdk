/**
 * Subtle grid + brand glow behind a section's hero content. `maskSize`
 * controls how far the grid fades from the top-center — the hero uses a
 * wider mask than the narrower MCP intro section.
 */
export function GridBackdrop({ maskSize }: { maskSize: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-25"
      style={{
        backgroundImage:
          'linear-gradient(to right, var(--color-fd-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-fd-border) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: `radial-gradient(ellipse ${maskSize} at 50% 0%, #000 40%, transparent 100%)`,
        WebkitMaskImage: `radial-gradient(ellipse ${maskSize} at 50% 0%, #000 40%, transparent 100%)`,
      }}
    />
  )
}
