/**
 * Glossary of SDK type names that appear inline across the docs tables.
 *
 * Any name listed here is auto-detected inside inline `code` spans (see the
 * `code` override in `mdx.tsx`) and turned into a click-to-open popover, so a
 * reader can see what a referenced type is without leaving the page.
 *
 * Two kinds of entry:
 *   - `named` (default): a concrete SDK type with its own definition section.
 *     Gets an accent style and a "view full definition" link.
 *   - `loose`: a deliberately untyped value (`object`, `any`, or a type the
 *     OpenAPI spec leaves open, like `ProxySettings`). Gets a distinct dashed
 *     style and an explanation of *why* it's untyped — no link, because there
 *     is no structured definition to point at.
 */
export interface TypeInfo {
  /** One-line summary shown inside the popover. */
  description: string
  /** Docs link to the type's full definition (page + anchor). Named types only. */
  href?: string
  /** `loose` for untyped/dynamic values; defaults to `named`. */
  kind?: 'named' | 'loose'
}

export const typeGlossary: Record<string, TypeInfo> = {
  // ── Users ──────────────────────────────────────────────────────────────
  UserResponse: {
    description: 'A user record, returned by getUser, addUser, modifyUser and most other user methods.',
    href: '/docs/modules/users#userresponse',
  },
  UserCreate: {
    description: 'Payload for addUser — the fields accepted when creating a new user.',
    href: '/docs/modules/users#usercreate',
  },
  UserModify: {
    description:
      'Payload for modifyUser — the same fields as UserCreate, all optional. Omitted fields are left unchanged.',
    href: '/docs/modules/users#usercreate',
  },
  UsersResponse: {
    description: 'Paginated list of users with a total count, returned by getUsers.',
    href: '/docs/modules/users#userresponse',
  },

  // ── Nodes ──────────────────────────────────────────────────────────────
  NodeResponse: {
    description: 'A connected Marzban node, returned by getNode, addNode, modifyNode and getNodes.',
    href: '/docs/modules/nodes#noderesponse',
  },
  NodeCreate: {
    description: 'Payload for addNode — connection details for registering a new node.',
    href: '/docs/modules/nodes#nodecreate',
  },
  NodeModify: {
    description: 'Payload for modifyNode — node fields to update, all optional. Omitted fields are left unchanged.',
    href: '/docs/modules/nodes#nodecreate',
  },

  // ── Admins ─────────────────────────────────────────────────────────────
  Admin: {
    description: 'An admin account, returned by getCurrentAdmin, createAdmin, modifyAdmin and getAdmins.',
    href: '/docs/modules/admins#admin',
  },
  AdminCreate: {
    description: 'Payload for createAdmin — the fields accepted when creating an admin.',
    href: '/docs/modules/admins#admincreate',
  },
  AdminModify: {
    description:
      'Payload for modifyAdmin — admin fields to update (password, sudo flag, Telegram, webhook), all optional.',
    href: '/docs/modules/admins#admincreate',
  },

  // ── User templates ─────────────────────────────────────────────────────
  UserTemplateResponse: {
    description: 'A reusable provisioning template, returned by the user-template methods.',
    href: '/docs/modules/user-templates#usertemplateresponse',
  },
  UserTemplateCreate: {
    description: 'Payload for addUserTemplate — the fields of a new provisioning template.',
    href: '/docs/modules/user-templates#usertemplateresponse',
  },
  UserTemplateModify: {
    description: 'Payload for modifyUserTemplate — template fields to update, all optional.',
    href: '/docs/modules/user-templates#usertemplateresponse',
  },

  // ── System & core ──────────────────────────────────────────────────────
  SystemStats: {
    description: 'Live system metrics (memory, CPU, user/bandwidth totals), returned by getSystemStats.',
    href: '/docs/modules/system#systemstats',
  },
  CoreStats: {
    description: 'Xray core status and version information, returned by getCoreStats.',
    href: '/docs/modules/core#corestats',
  },

  // ── Subscriptions ──────────────────────────────────────────────────────
  SubscriptionUserResponse: {
    description: 'Subscription details for a user, returned by userSubscriptionInfo.',
    href: '/docs/modules/subscriptions#subscriptionuserresponse',
  },

  // ── Proxy structures ───────────────────────────────────────────────────
  ProxyInbound: {
    description:
      'A configured Xray inbound: tag, protocol, network, tls and port. getInbounds returns these grouped by protocol.',
    href: '/docs/modules/system#proxyinbound',
  },
  ProxyHost: {
    description:
      'A proxy host entry for an inbound: remark, address, port, SNI plus security and transport options. getHosts returns these grouped by inbound tag.',
    href: '/docs/modules/system#proxyhost',
  },

  // ── Configuration & logging ────────────────────────────────────────────
  Config: {
    description:
      'The configuration object passed to createMarzbanSDK — credentials plus timeout, retries, token, logger and webhook options. Validated with Zod.',
    href: '/docs/configuration/config-options#reference',
  },
  LoggerOptions: {
    description:
      "Options for the built-in logger: an optional level ('debug' | 'info' | 'warn' | 'error') and a timestamp flag (default true). Both are optional.",
    href: '/docs/configuration/logging#loggeroptions',
  },
  Logger: {
    description:
      'Logger interface (debug / info / warn / error methods). Implement it to plug in your own logging stack, e.g. Winston or Pino.',
    href: '/docs/configuration/logging#custom-logger',
  },

  // ── Real-time logs ─────────────────────────────────────────────────────
  LogOptions: {
    description: 'Options for a WebSocket log stream: onMessage, an optional onError, and a polling interval.',
    href: '/docs/realtime/websocket-logs#logoptions',
  },

  // ── Webhooks ───────────────────────────────────────────────────────────
  WebhookType: {
    description:
      'Discriminated union of every webhook event payload, keyed by action. Narrow on payload.action to access event-specific fields.',
    href: '/docs/webhooks/event-types#typescript-types',
  },
  WebhookArrayType: {
    description: 'An array of WebhookType — what parseWebhook returns, since Marzban may deliver events in batches.',
    href: '/docs/webhooks/event-types#typescript-types',
  },
  WebhookAction: {
    description: 'The set of webhook action names: user_created, user_expired, reached_usage_percent, and so on.',
    href: '/docs/webhooks/event-types#events-reference',
  },

  // ── Errors ─────────────────────────────────────────────────────────────
  SdkError: {
    description: 'Base class for every SDK error. Carries a machine-readable code, optional details, and toJSON().',
    href: '/docs/advanced/error-handling#sdkerror-base-class',
  },
  AuthError: {
    description: 'Authentication failed (code AUTH_FAILED) — e.g. wrong credentials or the login request errored.',
    href: '/docs/advanced/error-handling#error-codes-reference',
  },
  AuthTokenError: {
    description: 'The server responded to login but returned no access_token (code AUTH_TOKEN_FAILED).',
    href: '/docs/advanced/error-handling#error-codes-reference',
  },
  ConfigurationError: {
    description: 'The config failed Zod validation (code CONFIG_INVALID). Details carries the Zod issues.',
    href: '/docs/advanced/error-handling#error-codes-reference',
  },
  HttpError: {
    description: 'An HTTP request failed — 4xx/5xx or a network timeout (code NETWORK_HTTP_ERROR).',
    href: '/docs/advanced/error-handling#error-codes-reference',
  },
  WebhookSignatureError: {
    description: 'A webhook signature was missing or the HMAC did not match (code WEBHOOK_SIGNATURE_ERROR).',
    href: '/docs/advanced/error-handling#error-codes-reference',
  },
  WebhookValidationError: {
    description: "A webhook payload didn't match the expected schema (code WEBHOOK_VALIDATION_ERROR).",
    href: '/docs/advanced/error-handling#error-codes-reference',
  },
  WebhookEnvironmentError: {
    description:
      'Signature verification was called in a browser context, which is unsupported (code WEBHOOK_ENVIRONMENT_ERROR).',
    href: '/docs/advanced/error-handling#error-codes-reference',
  },

  // ── Loose / dynamic values ─────────────────────────────────────────────
  ProxySettings: {
    kind: 'loose',
    description:
      'Protocol-specific proxy options — e.g. { id, flow } for VLESS or { password } for Trojan. Typed as a free-form object because the exact shape depends on the protocol.',
  },
  object: {
    kind: 'loose',
    description:
      'A plain object with no fixed schema. The SDK passes it through as-is, so its actual shape depends on the protocol or endpoint — check the surrounding context for what to expect.',
  },
  any: {
    kind: 'loose',
    description:
      "Intentionally untyped: there's no compile-time schema for this value, so you receive it raw and parse or narrow it yourself.",
  },
}

/**
 * Single regex matching any glossary type name on word boundaries. Names are
 * sorted longest-first so the alternation prefers the most specific match.
 */
export const typeNamePattern = new RegExp(
  `\\b(${Object.keys(typeGlossary)
    .sort((a, b) => b.length - a.length)
    .join('|')})\\b`,
  'g'
)
