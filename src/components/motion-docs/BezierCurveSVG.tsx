type Props = {
  cubicBezier: [number, number, number, number]
  label: string
  size?: number
}

// Plots a cubic-bezier easing curve (t → value, both in [0,1]) onto a square
// canvas. SVG's y-axis grows downward, so we flip: SVG y = size - value*size.
// The curve, control points, and tangent lines are mathematically exact —
// drawn via SVG's native `C` cubic-bezier command with the given control
// points, no approximation.
export default function BezierCurveSVG({ cubicBezier, label, size = 100 }: Props) {
  const [x1, y1, x2, y2] = cubicBezier
  const sx = (t: number) => t * size
  const sy = (v: number) => size - v * size

  const startX = sx(0)
  const startY = sy(0)
  const endX = sx(1)
  const endY = sy(1)
  const c1x = sx(x1)
  const c1y = sy(y1)
  const c2x = sx(x2)
  const c2y = sy(y2)

  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect
          x={0}
          y={0}
          width={size}
          height={size}
          fill="white"
          stroke="var(--color-grey-light-active)"
          strokeWidth={1}
        />
        {/* Linear reference line (t=0 → t=1) */}
        <line
          x1={0}
          y1={size}
          x2={size}
          y2={0}
          stroke="var(--color-grey-light-active)"
          strokeWidth={1}
          strokeDasharray="2 3"
        />
        {/* Tangent handles */}
        <line x1={startX} y1={startY} x2={c1x} y2={c1y} stroke="var(--color-pink-light-active)" strokeWidth={1} />
        <line x1={endX} y1={endY} x2={c2x} y2={c2y} stroke="var(--color-pink-light-active)" strokeWidth={1} />
        {/* The bezier itself */}
        <path
          d={`M ${startX} ${startY} C ${c1x} ${c1y} ${c2x} ${c2y} ${endX} ${endY}`}
          fill="none"
          stroke="var(--color-pink-normal)"
          strokeWidth={2}
          strokeLinecap="round"
        />
        {/* Control points */}
        <circle cx={c1x} cy={c1y} r={3} fill="var(--color-pink-normal)" />
        <circle cx={c2x} cy={c2y} r={3} fill="var(--color-pink-normal)" />
      </svg>
      <code className="font-mono text-[9px] leading-tight text-[var(--color-grey-dark)] whitespace-nowrap">
        {label}
      </code>
    </div>
  )
}
