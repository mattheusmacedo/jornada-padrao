import type { MusicBurstLaneConfig } from './musicBurstConfig'

export const BURST_ORIGIN = { x: 0.5, y: 0.46 } as const

export function burstLanePath(lane: MusicBurstLaneConfig) {
  const startX = BURST_ORIGIN.x * 100
  const startY = BURST_ORIGIN.y * 100
  const endX = lane.x * 100
  const endY = lane.y * 100
  const controlX = (startX + endX) / 2 + lane.curveX * 100
  const controlY = (startY + endY) / 2 + lane.curveY * 100

  return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`
}
