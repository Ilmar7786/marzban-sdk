/**
 * i18n seam.
 *
 * The site ships English-only with clean URLs (`/docs`, not `/en/docs`).
 * Full locale routing is deferred on purpose: GitHub Pages is pure static
 * hosting with no middleware/rewrites, so hiding the default locale prefix
 * (`hideLocale: 'default-locale'`) is impossible there. Forcing `/en/...`
 * prefixes + a root redirect for a single language is not worth it.
 *
 * The language switcher in the header is rendered from `locales` below, so the
 * affordance is visible today even with one entry.
 *
 * To add a translation later (mechanical, not a rewrite):
 *   1. Push the locale to `locales`, e.g. { locale: 'ru', name: 'Русский' }.
 *   2. Add `i18n` config (defineI18n from 'fumadocs-core/i18n') and pass it to
 *      the loader in `src/lib/source.ts`.
 *   3. Move route groups under `src/app/[lang]/` and add `generateStaticParams`
 *      for the locales.
 *   4. Provide translated content as `content/docs/<file>.<locale>.mdx`.
 */

export interface LocaleItem {
  locale: string
  name: string
}

export const defaultLocale = 'en'

export const locales: LocaleItem[] = [{ locale: 'en', name: 'English' }]
