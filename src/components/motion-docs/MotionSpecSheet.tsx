import type { MotionSpecProperty, MotionSpecSheet as MotionSpecSheetData } from '../../motion/specSheet'

const ROW_HEIGHT = 'min-h-[132px]'

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value))
}

function niceTimeMax(spec: MotionSpecSheetData) {
  const rowMax = spec.layers.flatMap((layer) => layer.rows).reduce((max, row) => Math.max(max, row.endMs), 0)
  const rawMax = Math.max(spec.totalDurationMs, rowMax, 150)
  const step = rawMax > 900 ? 200 : rawMax > 500 ? 100 : 50

  return Math.ceil(rawMax / step) * step
}

function timeStep(maxMs: number) {
  if (maxMs > 900) return 200
  if (maxMs > 300) return 100
  return 50
}

function timeTicks(maxMs: number) {
  const step = timeStep(maxMs)
  const ticks = []

  for (let ms = 0; ms <= maxMs; ms += step) ticks.push(ms)

  return ticks
}

function TimelineLabels({ maxMs }: { maxMs: number }) {
  return (
    <div className="relative h-8 text-[10px] font-semibold uppercase leading-[1.4] tracking-[0.06em] text-[var(--color-grey-dark)]">
      {timeTicks(maxMs).map((tick) => {
        const isFirstTick = tick === 0
        const isLastTick = tick === maxMs
        const alignment = isFirstTick ? 'translate-x-0' : isLastTick ? '-translate-x-full' : '-translate-x-1/2'

        return (
          <span
            key={tick}
            data-motion-time-label="true"
            className={`absolute top-0 ${alignment}`}
            style={{ left: `${(tick / maxMs) * 100}%` }}
          >
            {tick}ms
          </span>
        )
      })}
    </div>
  )
}

function TimelineSegment({ maxMs, row, segment }: {
  maxMs: number
  row: MotionSpecProperty
  segment: MotionSpecProperty['segments'][number]
}) {
  const start = clampPercent((segment.startMs / maxMs) * 100)
  const end = clampPercent((segment.endMs / maxMs) * 100)
  const labelLeft = `${Math.min(start + 1.5, 80)}%`
  const labelEndsAtEdge = end >= 92
  const labelPosition = labelEndsAtEdge ? { right: `${100 - end}%` } : { left: labelLeft }

  if (segment.type === 'hold') {
    return (
      <div
        className="absolute top-[72px] flex h-[36px] items-center justify-center rounded-[8px] border border-[var(--color-brand-orange-normal)] bg-white px-3 text-center text-[10px] font-bold leading-[1.45] text-[var(--color-brand-brown-dark)]"
        style={{ left: `${start}%`, right: `${100 - end}%` }}
      >
        <span className="leading-[1.2]">
          <span className="block">{segment.label}</span>
          <span className="block">{segment.durationMs}ms</span>
        </span>
      </div>
    )
  }

  const startMarkerAlignment = start <= 0.5 ? 'translate-x-0' : '-translate-x-1/2'
  const endMarkerAlignment = end >= 99.5 ? '-translate-x-full' : '-translate-x-1/2'

  return (
    <>
      <div
        className="absolute top-[90px] h-[2px]"
        style={{
          background: row.color,
          boxShadow: `0 0 0 1px ${row.color}`,
          left: `${start}%`,
          right: `${100 - end}%`,
        }}
      />
      <span
        className={`absolute top-[84px] h-[14px] w-[14px] ${startMarkerAlignment} rounded-[3px]`}
        style={{ background: row.color, left: `${start}%` }}
      />
      <span
        className={`absolute top-[84px] h-[14px] w-[14px] ${endMarkerAlignment} rounded-[3px]`}
        style={{ background: row.color, left: `${end}%` }}
      />
      <div
        className={`absolute top-4 max-w-[170px] text-[10px] font-semibold leading-[1.6] ${labelEndsAtEdge ? 'text-right' : ''}`}
        style={{ color: row.color, ...labelPosition }}
      >
        <span className="block uppercase tracking-[0.05em]">{segment.label}</span>
        <span className="block">{segment.detail}</span>
        <span className="block text-[var(--color-grey-dark)]">{segment.durationMs}ms</span>
      </div>
    </>
  )
}

function TimelineRow({ maxMs, row }: { maxMs: number; row: MotionSpecProperty }) {
  return (
    <div className={`relative ${ROW_HEIGHT} border-t border-[var(--color-grey-light-active)]`}>
      {row.segments.map((segment) => (
        <TimelineSegment key={segment.id} maxMs={maxMs} row={row} segment={segment} />
      ))}
    </div>
  )
}

function RowTimingSummary({ summary }: { summary: string }) {
  return (
    <div className="mt-3 grid gap-1 text-[10px] leading-[1.55] text-[var(--color-grey-dark-active)]">
      {summary.split(' | ').map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  )
}

function RowLabel({ row }: { row: MotionSpecProperty }) {
  return (
    <div data-motion-row-label="true" className={`${ROW_HEIGHT} border-t border-[var(--color-grey-light-active)] py-6 pr-5`}>
      <p className="text-[12px] font-extrabold uppercase leading-[1.35] tracking-[0.05em] text-[var(--color-grey-darker)]">{row.label}</p>
      <div className="mt-5">
        <p className="text-[11px] font-semibold leading-[1.65] text-[var(--color-grey-darker)]">{row.valuePath}</p>
        <RowTimingSummary summary={row.timingSummary} />
      </div>
    </div>
  )
}

export function MotionSpecSheet({ spec }: { spec: MotionSpecSheetData }) {
  const maxMs = niceTimeMax(spec)

  return (
    <div data-motion-spec-sheet="true" className="h-full overflow-hidden rounded-[8px] border border-[var(--color-grey-light-active)] bg-white text-[var(--color-grey-darker)]">
      <div className="border-b border-[var(--color-grey-light-active)] px-5 py-4">
        <p className="text-[11px] font-extrabold uppercase leading-[1.25] tracking-[0.14em] text-[var(--color-brand-pink-normal)]">Motion spec sheet timeline</p>
      </div>

      <div className="p-5">
        <div data-motion-spec-timeline="true" className="overflow-x-auto">
          <div className="grid grid-cols-[164px_minmax(0,1fr)] gap-x-4">
            <div />
            <TimelineLabels maxMs={maxMs} />
            {spec.layers.map((layer) => (
              <div key={layer.id} className="contents">
                <div className="col-span-2 mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[8px] border border-[var(--color-grey-light-active)] bg-[var(--color-grey-light)] px-4 py-3">
                  <span className="inline-flex rounded-[4px] bg-[var(--color-brand-pink-normal)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-white">
                    {layer.name}
                  </span>
                  <span className="text-[11px] leading-[1.5] text-[var(--color-grey-dark-active)]">
                    {layer.role} / anchor: {layer.anchorPoint}
                  </span>
                </div>
                {layer.rows.map((row) => (
                  <div key={row.id} className="contents">
                    <RowLabel row={row} />
                    <div
                      className="relative min-w-0"
                      style={{
                        backgroundImage: `repeating-linear-gradient(to right, rgba(64,64,64,0.12) 0, rgba(64,64,64,0.12) 1px, transparent 1px, transparent ${100 / (maxMs / timeStep(maxMs))}%)`,
                      }}
                    >
                      <TimelineRow maxMs={maxMs} row={row} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
