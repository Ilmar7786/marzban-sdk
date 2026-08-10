import { ImageResponse } from 'next/og'

import { appName } from '@/lib/shared'

// Default social card for the landing page (and any page that doesn't ship its
// own image). Docs pages override this with a per-page generated image.
// Required so the image is emitted as a static asset under `output: 'export'`.
export const dynamic = 'force-static'
export const alt = `${appName} — The complete TypeScript SDK for the Marzban API`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 80,
        color: '#fff',
        fontFamily: 'sans-serif',
        backgroundColor: '#0B0813',
        backgroundImage:
          'radial-gradient(900px 500px at 12% 0%, rgba(115,70,241,0.45), transparent 60%), radial-gradient(900px 500px at 100% 100%, rgba(191,52,178,0.40), transparent 55%)',
      }}
    >
      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 72,
            height: 72,
            borderRadius: 18,
            background: 'linear-gradient(135deg, #7346F1 0%, #BF34B2 100%)',
            fontSize: 48,
            fontWeight: 800,
          }}
        >
          M
        </div>
        <div style={{ fontSize: 34, fontWeight: 700 }}>{appName}</div>
      </div>

      {/* Headline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 68,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          <div style={{ display: 'flex' }}>The complete SDK</div>
          <div style={{ display: 'flex' }}>for the Marzban API</div>
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: '#B9B3C9', maxWidth: 900, lineHeight: 1.35 }}>
          Fully typed API coverage, auto token refresh, WebSocket streaming, and webhooks.
        </div>
      </div>

      {/* Footer chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 24, color: '#CFC9DC' }}>
        <span>TypeScript</span>
        <span style={{ color: '#6E6880' }}>·</span>
        <span>Node.js, Bun &amp; Deno</span>
        <span style={{ color: '#6E6880' }}>·</span>
        <span>Browser</span>
      </div>
    </div>,
    { ...size }
  )
}
