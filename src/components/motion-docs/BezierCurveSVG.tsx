import { useEffect, useState } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { Copy, Check } from 'lucide-react'

type Props = {
  cubicBezier: [number, number, number, number]
  durationMs: number
  replayKey: number
  size?: number
}

const REPEAT_PAUSE_MS = 500

// Cubic bezier point evaluator — exact, no approximation.
// Returns position along the curve at parameter v ∈ [0, 1].
function bezierComponent(
  v: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number
): number {
  const u = 1 - v
  return u * u * u * p0 + 3 * u * u * v * p1 + 3 * u * v * v * p2 + v * v * v * p3
}

export default function BezierCurveSVG({
  cubicBezier,
  durationMs,
  replayKey,
  size = 300,
}: Props) {
  const [x1, y1, x2, y2] = cubicBezier

  // Map (t, value) ∈ [0,1]² to SVG coordinates. SVG y grows downward so we
  // flip: value=0 → y=size (bottom), value=1 → y=0 (top).
  const sx = (v: number) => v * size
  const sy = (v: number) => size - v * size

  const startX = sx(0)
  const startY = sy(0)
  const endX = sx(1)
  const endY = sy(1)
  const c1x = sx(x1)
  const c1y = sy(y1)
  const c2x = sx(x2)
  const c2y = sy(y2)

  // Tracer animation: t advances linearly 0→1 over durationMs, holds at 1 for
  // REPEAT_PAUSE_MS, then snaps back to 0 and repeats. The tracer's screen
  // position is computed from t via the cubic bezier formula.
  const t = useMotionValue(0)
  const tracerX = useTransform(t, (v) => bezierComponent(v, startX, c1x, c2x, endX))
  const tracerY = useTransform(t, (v) => bezierComponent(v, startY, c1y, c2y, endY))

  useEffect(() => {
    t.set(0)
    const controls = animate(t, 1, {
      duration: durationMs / 1000,
      ease: 'linear',
      repeat: Infinity,
      repeatDelay: REPEAT_PAUSE_MS / 1000,
      repeatType: 'loop',
    })
    return () => controls.stop()
  }, [t, durationMs, replayKey])

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="rounded-2xl bg-white border border-[var(--color-grey-light-active)]"
    >
      {/* Linear reference diagonal (t = value) */}
      <line
        x1={0}
        y1={size}
        x2={size}
        y2={0}
        stroke="var(--color-grey-light-active)"
        strokeWidth={1}
        strokeDasharray="3 4"
      />
      {/* Tangent handles */}
      <line
        x1={startX}
        y1={startY}
        x2={c1x}
        y2={c1y}
        stroke="var(--color-pink-normal)"
        strokeOpacity={0.5}
        strokeWidth={1.5}
      />
      <line
        x1={endX}
        y1={endY}
        x2={c2x}
        y2={c2y}
        stroke="var(--color-pink-normal)"
        strokeOpacity={0.5}
        strokeWidth={1.5}
      />
      {/* The bezier curve */}
      <path
        d={`M ${startX} ${startY} C ${c1x} ${c1y} ${c2x} ${c2y} ${endX} ${endY}`}
        fill="none"
        stroke="var(--color-pink-normal)"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {/* Control points */}
      <circle cx={c1x} cy={c1y} r={6} fill="var(--color-pink-normal)" />
      <circle cx={c2x} cy={c2y} r={6} fill="var(--color-pink-normal)" />
      {/* Tracer */}
      <motion.circle
        cx={tracerX}
        cy={tracerY}
        r={7}
        fill="var(--color-pink-normal)"
        stroke="white"
        strokeWidth={2}
      />
    </svg>
  )
}

export function BezierCopyButton({ values }: { values: number[] }) {
  const [copied, setCopied] = useState(false)
  const text = values.join(', ')

  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // Older browsers / non-secure contexts — fall back to a textarea trick.
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch { /* swallow */ }
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    }
  }

  return (
    <button
      type="button"
      onClick={handle}
      className="flex items-center gap-1 text-[11px] text-[var(--color-grey-dark)] hover:text-[var(--color-pink-normal)] transition-none"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      <span>{copied ? 'Copiado!' : 'Copy'}</span>
    </button>
  )
}
