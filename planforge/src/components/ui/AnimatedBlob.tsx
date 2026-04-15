interface AnimatedBlobProps {
  gradient: string
  width: number
  height: number
  top?: number | string
  left?: number | string
  right?: number | string
  bottom?: number | string
  delay?: number
  opacity?: number
}

export function AnimatedBlob({
  gradient,
  width,
  height,
  top,
  left,
  right,
  bottom,
  delay = 0,
  opacity = 0.15,
}: AnimatedBlobProps) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        width,
        height,
        top,
        left,
        right,
        bottom,
        borderRadius: '50%',
        filter: 'blur(80px)',
        background: gradient,
        opacity,
        pointerEvents: 'none',
        animation: `blobFloat 8s ease-in-out ${delay}s infinite alternate`,
        zIndex: -1,
      }}
    />
  )
}
