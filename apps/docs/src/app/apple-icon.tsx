import { ImageResponse } from 'next/og'

// iOS home-screen / touch icon. Brand monogram on the gradient mark.
export const dynamic = 'force-static'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #7346F1 0%, #BF34B2 100%)',
        color: '#fff',
        fontSize: 120,
        fontWeight: 800,
        letterSpacing: -4,
      }}
    >
      M
    </div>,
    { ...size }
  )
}
