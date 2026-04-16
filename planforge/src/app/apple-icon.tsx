import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #2D6A4F, #52B788)',
        borderRadius: 40,
        width: 180,
        height: 180,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 900,
        fontSize: 110,
        fontFamily: 'sans-serif',
      }}
    >
      T
    </div>,
    { ...size }
  )
}
