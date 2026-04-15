export function DotPattern({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 bg-dot-pattern ${className}`}
      style={{ zIndex: -1 }}
    />
  )
}
