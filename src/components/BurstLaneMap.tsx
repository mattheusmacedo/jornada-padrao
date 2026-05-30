import { useId } from 'react'
import type { MusicBurstLaneConfig } from './musicBurstConfig'
import { burstLanePath } from './burstLaneGeometry'

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value * 100))
}

type BurstLaneMapProps = {
  className?: string
  color?: string
  lanes: MusicBurstLaneConfig[]
  onSelectLane?: (laneId: string) => void
  selectedLaneId?: string
  selectedTextColor?: string
}

export function BurstLaneMap({
  className = '',
  color = '#ffffff',
  lanes,
  onSelectLane,
  selectedLaneId,
  selectedTextColor = '#666666',
}: BurstLaneMapProps) {
  const rawMarkerId = useId()
  const markerId = `burst-lane-arrow-${rawMarkerId.replace(/[^a-zA-Z0-9_-]/g, '')}`

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full overflow-hidden"
        preserveAspectRatio="none"
      >
        <defs>
          <marker
            id={markerId}
            markerHeight="5"
            markerWidth="5"
            orient="auto"
            refX="4"
            refY="2.5"
          >
            <path d="M0,0 L5,2.5 L0,5 Z" fill={color} />
          </marker>
        </defs>
        {lanes.map((lane) => {
          const isSelected = lane.id === selectedLaneId

          return (
            <path
              key={lane.id}
              d={burstLanePath(lane)}
              fill="none"
              markerEnd={`url(#${markerId})`}
              stroke={color}
              strokeDasharray={lane.enabled ? undefined : '2 2'}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={lane.enabled ? (isSelected ? 0.95 : 0.34) : 0.15}
              strokeWidth={isSelected ? 0.9 : 0.45}
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
      </svg>
      {lanes.map((lane, index) => {
        const isSelected = lane.id === selectedLaneId

        return (
          <button
            key={lane.id}
            type="button"
            aria-label={lane.label}
            disabled={!onSelectLane}
            onClick={() => onSelectLane?.(lane.id)}
            className="pointer-events-auto absolute flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-bold shadow-[0_10px_26px_rgba(0,0,0,0.22)] disabled:pointer-events-none"
            style={{
              left: `${clampPercent(lane.x)}%`,
              top: `${clampPercent(lane.y)}%`,
              transform: 'translate(-50%, -50%)',
              borderColor: color,
              background: isSelected ? color : 'rgba(102,102,102,0.82)',
              color: isSelected ? selectedTextColor : '#ffffff',
              opacity: lane.enabled ? 1 : 0.42,
            }}
          >
            {index + 1}
          </button>
        )
      })}
    </div>
  )
}

export function BurstLaneGuideOverlay(props: BurstLaneMapProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      <BurstLaneMap
        {...props}
        className={`pointer-events-none absolute inset-0 ${props.className ?? ''}`}
      />
    </div>
  )
}
