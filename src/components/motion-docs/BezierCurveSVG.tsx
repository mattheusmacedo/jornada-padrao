import { useEffect, useState } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { Copy, Check } from 'lucide-react'
import type { Locale } from '../../motion/motionDocsCopy'

type Props = {
  cubicBezier: [number, number, number, number]
  durationMs: number
  replayKey: number
  size?: number
}

// Inner inset so control points and the tracer never touch (or get clipped at)
// the canvas border. Bezier domain (0..1) maps to [PADDING, size - PADDING].
const PADDING = 24

// Cubic bezier point evaluator — exact, no approximation.
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

  // Inset coordinate mapping: (0,0) → bottom-left of inner area;
  // (1,1) → top-right of inner area. SVG y-axis is flipped (grows down).
  const inner = size - 2 * PADDING
  const sx = (v: number) => PADDING + v * inner
  const sy = (v: number) => PADDING + (1 - v) * inner

  const startX = sx(0)
  const startY = sy(0)
  const endX = sx(1)
  const endY = sy(1)
  const c1x = sx(x1)
  const c1y = sy(y1)
  const c2x = sx(x2)
  const c2y = sy(y2)

  // Tracer: parked at t=0 on first mount; on each Replay (replayKey bump),
  // resets to 0 and travels to 1 once, in durationMs. No auto-loop.
  const t = useMotionValue(0)
  const tracerX = useTransform(t, (v) => bezierComponent(v, startX, c1x, c2x, endX))
  const tracerY = useTransform(t, (v) => bezierComponent(v, startY, c1y, c2y, endY))

  useEffect(() => {
    // replayKey === 0 is the initial-mount state — stay parked at t=0.
    if (replayKey === 0) {
      t.set(0)
      return
    }
    t.set(0)
    const controls = animate(t, 1, {
      duration: durationMs / 1000,
      ease: 'linear',
    })
    return () => controls.stop()
  }, [t, durationMs, replayKey])

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="rounded-[8px] border border-[var(--color-grey-light-active)] bg-white"
    >
      {/* Faint outline of the inner math area */}
      <rect
        x={PADDING}
        y={PADDING}
        width={inner}
        height={inner}
        fill="none"
        stroke="var(--color-grey-light-active)"
        strokeWidth={1}
        strokeOpacity={0.5}
      />
      {/* Linear reference diagonal (t = value) */}
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
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
        stroke="var(--color-brand-pink-normal)"
        strokeOpacity={0.5}
        strokeWidth={1.5}
      />
      <line
        x1={endX}
        y1={endY}
        x2={c2x}
        y2={c2y}
        stroke="var(--color-brand-pink-normal)"
        strokeOpacity={0.5}
        strokeWidth={1.5}
      />
      {/* The bezier curve */}
      <path
        d={`M ${startX} ${startY} C ${c1x} ${c1y} ${c2x} ${c2y} ${endX} ${endY}`}
        fill="none"
        stroke="var(--color-brand-pink-normal)"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {/* Endpoints + control points */}
      <circle cx={startX} cy={startY} r={4} fill="var(--color-brand-pink-normal)" />
      <circle cx={endX} cy={endY} r={4} fill="var(--color-brand-pink-normal)" />
      <circle cx={c1x} cy={c1y} r={6} fill="var(--color-brand-pink-normal)" />
      <circle cx={c2x} cy={c2y} r={6} fill="var(--color-brand-pink-normal)" />
      {/* Tracer — parked at start by default, animates on Replay */}
      <motion.circle
        cx={tracerX}
        cy={tracerY}
        r={7}
        fill="var(--color-brand-pink-normal)"
        stroke="white"
        strokeWidth={2}
      />
    </svg>
  )
}

export function BezierCopyButton({ locale = 'en', values }: { locale?: Locale; values: number[] }) {
  const [copied, setCopied] = useState(false)
  const text = values.join(', ')
  const label = copied
    ? locale === 'pt' ? 'Copiado!' : 'Copied!'
    : locale === 'pt' ? 'Copiar' : 'Copy'

  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
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
      className="flex items-center gap-1 text-[11px] text-[var(--color-grey-dark)] transition-none hover:text-[var(--color-brand-pink-normal)]"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      <span>{label}</span>
    </button>
  )
}
