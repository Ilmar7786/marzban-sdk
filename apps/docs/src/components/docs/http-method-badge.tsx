/** Industry-standard REST method colors (Swagger/Redoc convention) — semantic, not brand tokens. */
const METHOD_STYLES: Record<string, string> = {
  GET: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10',
  POST: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10',
  PUT: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10',
  PATCH: 'text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-500/10',
  DELETE: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10',
}

export function HttpMethodBadge({ method }: { method: string }) {
  return (
    <span
      className={`inline-block w-14 shrink-0 rounded-md py-0.5 text-center font-mono text-[11px] font-bold ${
        METHOD_STYLES[method] ?? 'bg-fd-muted text-fd-muted-foreground'
      }`}
    >
      {method}
    </span>
  )
}
