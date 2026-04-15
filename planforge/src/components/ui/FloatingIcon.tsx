interface FloatingIconProps {
  emoji: string
  size?: number
  top?: string
  left?: string
  right?: string
  bottom?: string
  delay?: number
  opacity?: number
}

export function FloatingIcon({
  emoji,
  size = 32,
  top,
  left,
  right,
  bottom,
  delay = 0,
  opacity = 0.1,
}: FloatingIconProps) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top,
        left,
        right,
        bottom,
        fontSize: size,
        opacity,
        pointerEvents: 'none',
        userSelect: 'none',
        animation: `iconFloat 6s ease-in-out ${delay}s infinite alternate`,
        zIndex: -1,
      }}
    >
      {emoji}
    </div>
  )
}
