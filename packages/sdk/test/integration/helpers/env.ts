/**
 * Defaults match local/marzban/.env.example — a fresh `pnpm local:up` works
 * with zero extra config. Override via env vars to point at a differently
 * configured panel.
 */
export interface IntegrationEnv {
  baseUrl: string
  username: string
  password: string
}

export function getIntegrationEnv(): IntegrationEnv {
  return {
    baseUrl: process.env.MARZBAN_BASE_URL ?? 'https://127.0.0.1:8000',
    username: process.env.MARZBAN_USERNAME ?? 'admin',
    password: process.env.MARZBAN_PASSWORD ?? 'changeme-local-only',
  }
}
