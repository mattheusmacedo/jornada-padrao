import { useMemo, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { RotateCcw, Sparkles } from 'lucide-react'
import AlphaVideo from '../components/AlphaVideo'
import { BurstLaneGuideOverlay } from '../components/BurstLaneMap'
import { BURST_ORIGIN } from '../components/burstLaneGeometry'
import MusicModelPreview from '../components/MusicModelPreview'
import MusicNotesOverlay from '../components/MusicNotesOverlay'
import type { MusicNotesOverlayHandle } from '../components/MusicNotesOverlay'
import {
  cloneMusicBurstLanes,
  MUSIC_BURST_MODEL_SPECS,
  MUSIC_MODEL_LABELS,
} from '../components/musicBurstConfig'
import type { MusicBurstLaneConfig, MusicModelId } from '../components/musicBurstConfig'
import { DEFAULT_MUSIC_NOTE_BURST_SETTINGS } from '../components/musicNotesConfig'
import type { MusicNoteBurstSettings } from '../components/musicNotesConfig'

const DEFAULT_STAGE_BG = '#E8176B'
const DEFAULT_PANEL_COLOR = '#666666'
const DEFAULT_GUIDE_COLOR = '#ffffff'
const SANDBOX_LANE_STAGGER_MS = 52

type LaneNumberKey = keyof Pick<
  MusicBurstLaneConfig,
  'curveX' | 'curveY' | 'depth' | 'lift' | 'scale' | 'speed' | 'spin' | 'spreadX' | 'spreadY' | 'x' | 'y'
>

const GLOBAL_CONTROLS = [
  { key: 'amount', label: 'Objects', min: 1, max: 10, step: 1 },
  { key: 'size', label: 'Size', min: 0.45, max: 2.2, step: 0.05 },
  { key: 'speed', label: 'Speed', min: 0.35, max: 1.8, step: 0.05 },
  { key: 'duration', label: 'Life', min: 0.65, max: 2.4, step: 0.05 },
] as const

const LANE_SLIDERS: Array<{
  key: LaneNumberKey
  label: string
  min: number
  max: number
  step: number
}> = [
  { key: 'x', label: 'Exit X', min: -0.35, max: 1.35, step: 0.01 },
  { key: 'y', label: 'Exit Y', min: -0.35, max: 1.35, step: 0.01 },
  { key: 'curveX', label: 'Curve X', min: -0.45, max: 0.45, step: 0.01 },
  { key: 'curveY', label: 'Curve Y', min: -0.45, max: 0.45, step: 0.01 },
  { key: 'spreadX', label: 'Spread X', min: 0, max: 0.12, step: 0.002 },
  { key: 'spreadY', label: 'Spread Y', min: 0, max: 0.12, step: 0.002 },
  { key: 'scale', label: 'Lane size', min: 0.35, max: 2.4, step: 0.05 },
  { key: 'speed', label: 'Lane speed', min: 0.35, max: 2.2, step: 0.05 },
  { key: 'depth', label: 'Depth', min: 0, max: 4, step: 0.05 },
  { key: 'lift', label: 'Lift', min: -0.45, max: 0.45, step: 0.01 },
  { key: 'spin', label: 'Spin', min: 0, max: 2.5, step: 0.05 },
]

function formatValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

function SliderRow({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  label: string
  max: number
  min: number
  onChange: (value: number) => void
  step: number
  value: number
}) {
  return (
    <label className="grid gap-1">
      <span className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-white/82">
        <span>{label}</span>
        <span className="font-mono text-white">{formatValue(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        className="h-5 w-full accent-white"
      />
    </label>
  )
}

export default function BurstSandbox() {
  const overlayRef = useRef<MusicNotesOverlayHandle>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [stageBg, setStageBg] = useState(DEFAULT_STAGE_BG)
  const [panelColor, setPanelColor] = useState(DEFAULT_PANEL_COLOR)
  const [guideColor, setGuideColor] = useState(DEFAULT_GUIDE_COLOR)
  const [intensity, setIntensity] = useState(1)
  const [lanes, setLanes] = useState<MusicBurstLaneConfig[]>(() => cloneMusicBurstLanes())
  const [selectedLaneId, setSelectedLaneId] = useState(() => lanes[0].id)
  const [settings, setSettings] = useState<MusicNoteBurstSettings>({
    ...DEFAULT_MUSIC_NOTE_BURST_SETTINGS,
  })
  const selectedLane = lanes.find((lane) => lane.id === selectedLaneId) ?? lanes[0]
  const exportPayload = useMemo(() => JSON.stringify({
    colors: {
      stageBg,
      panelColor,
      guideColor,
    },
    burst: {
      intensity,
      settings,
      lanes,
    },
  }, null, 2), [guideColor, intensity, lanes, panelColor, settings, stageBg])

  const triggerBurst = (laneId?: string) => {
    const rect = stageRef.current?.getBoundingClientRect()
    const width = rect?.width ?? 390
    const height = rect?.height ?? 844

    overlayRef.current?.burst(
      {
        x: width * BURST_ORIGIN.x,
        y: height * BURST_ORIGIN.y,
      },
      {
        intensity,
        laneId,
        laneStaggerMs: SANDBOX_LANE_STAGGER_MS,
        stagger: !laneId,
      },
    )
  }

  const handleStagePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return

    triggerBurst()
  }

  const resetLanes = () => {
    const nextLanes = cloneMusicBurstLanes()
    setLanes(nextLanes)
    setSelectedLaneId(nextLanes[0].id)
  }

  const updateSetting = (key: keyof MusicNoteBurstSettings, value: number) => {
    setSettings((currentSettings) => ({ ...currentSettings, [key]: value }))
  }

  const updateSelectedLane = (patch: Partial<MusicBurstLaneConfig>) => {
    setLanes((currentLanes) => currentLanes.map((lane) => (
      lane.id === selectedLane.id ? { ...lane, ...patch } : lane
    )))
  }

  const updateSelectedLaneNumber = (key: LaneNumberKey, value: number) => {
    updateSelectedLane({ [key]: value })
  }

  const toggleLaneModel = (modelId: MusicModelId) => {
    const hasModel = selectedLane.models.includes(modelId)
    const nextModels = hasModel
      ? selectedLane.models.filter((selectedModelId) => selectedModelId !== modelId)
      : [...selectedLane.models, modelId]

    if (nextModels.length === 0) return
    updateSelectedLane({ models: nextModels })
  }

  return (
    <main
      className="min-h-screen overflow-x-hidden px-4 py-4 text-white"
      style={{ background: '#1c1c1c' }}
    >
      <div className="mx-auto grid max-w-[1440px] grid-cols-[minmax(360px,500px)_minmax(0,1fr)] gap-4">
        <section className="min-h-[calc(100vh-40px)]">
          <div
            ref={stageRef}
            onPointerDown={handleStagePointerDown}
            className="relative mx-auto h-[calc(100vh-32px)] min-h-[760px] max-h-[980px] w-full max-w-[500px] overflow-hidden border border-white/20 shadow-[0_24px_80px_rgba(0,0,0,0.38)]"
            style={{ background: stageBg }}
          >
            <MusicNotesOverlay
              ref={overlayRef}
              lanes={lanes}
              settings={settings}
              className="pointer-events-none absolute inset-0 z-10 h-full w-full"
            />
            <BurstLaneGuideOverlay
              color={guideColor}
              lanes={lanes}
              onSelectLane={setSelectedLaneId}
              selectedLaneId={selectedLane.id}
            />
            <div className="pointer-events-none absolute left-1/2 top-[46%] z-[1] h-[34%] w-[86%] -translate-x-1/2 -translate-y-1/2">
              <AlphaVideo
                src="/videos/state-machine/idle"
                className="h-full w-full"
                style={{ objectFit: 'contain' }}
              />
            </div>
            <h1 className="pointer-events-none absolute left-1/2 top-[69%] z-[1] w-[300px] -translate-x-1/2 text-center text-[26px] font-extrabold uppercase leading-[1.28] tracking-[0.04em]">
              Evento<br />adicionado<br />ao seu perfil!
            </h1>
          </div>
        </section>

        <section className="grid max-h-[calc(100vh-32px)] grid-cols-[minmax(300px,0.95fr)_minmax(300px,1.05fr)] gap-4 overflow-hidden">
          <div className="overflow-y-auto rounded-[8px] p-4 scrollbar-hide" style={{ background: panelColor }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/70">Burst Sandbox</p>
                <h2 className="mt-1 text-[24px] font-bold leading-none">Lane pattern</h2>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => triggerBurst()}
                  className="flex h-10 items-center gap-2 rounded-[7px] bg-white px-3 text-[13px] font-bold text-[#666666]"
                >
                  <Sparkles size={16} />
                  Burst
                </button>
                <button
                  type="button"
                  onClick={resetLanes}
                  aria-label="Reset lanes"
                  className="flex h-10 w-10 items-center justify-center rounded-[7px] border border-white/35 text-white"
                >
                  <RotateCcw size={17} />
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-white/82">
                Background
                <input
                  type="color"
                  value={stageBg}
                  onChange={(event) => setStageBg(event.currentTarget.value)}
                  className="h-9 w-full rounded-[7px] border border-white/25 bg-transparent"
                />
              </label>
              <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-white/82">
                Panel
                <input
                  type="color"
                  value={panelColor}
                  onChange={(event) => setPanelColor(event.currentTarget.value)}
                  className="h-9 w-full rounded-[7px] border border-white/25 bg-transparent"
                />
              </label>
              <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-white/82">
                Guides
                <input
                  type="color"
                  value={guideColor}
                  onChange={(event) => setGuideColor(event.currentTarget.value)}
                  className="h-9 w-full rounded-[7px] border border-white/25 bg-transparent"
                />
              </label>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {GLOBAL_CONTROLS.map((control) => (
                <SliderRow
                  key={control.key}
                  label={control.label}
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={settings[control.key]}
                  onChange={(value) => updateSetting(control.key, value)}
                />
              ))}
              <SliderRow
                label="Intensity"
                min={0}
                max={1}
                step={0.01}
                value={intensity}
                onChange={setIntensity}
              />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {lanes.map((lane, index) => (
                <button
                  key={lane.id}
                  type="button"
                  onClick={() => setSelectedLaneId(lane.id)}
                  className="min-h-[46px] rounded-[7px] border px-2 py-2 text-left text-[11px] font-bold uppercase leading-tight"
                  style={{
                    borderColor: selectedLane.id === lane.id ? guideColor : 'rgba(255,255,255,0.22)',
                    background: selectedLane.id === lane.id ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)',
                    opacity: lane.enabled ? 1 : 0.45,
                  }}
                >
                  <span className="block text-white/60">Lane {index + 1}</span>
                  {lane.label}
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-[8px] border border-white/20 bg-black/10 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/60">Selected</p>
                  <h3 className="text-[18px] font-bold">{selectedLane.label}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => triggerBurst(selectedLane.id)}
                    className="h-9 rounded-[7px] bg-white px-3 text-[12px] font-bold text-[#666666]"
                  >
                    Test lane
                  </button>
                  <label className="flex h-9 items-center gap-2 rounded-[7px] border border-white/25 px-3 text-[12px] font-bold">
                    <input
                      type="checkbox"
                      checked={selectedLane.enabled}
                      onChange={(event) => updateSelectedLane({ enabled: event.currentTarget.checked })}
                      className="accent-white"
                    />
                    On
                  </label>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {LANE_SLIDERS.map((slider) => (
                  <SliderRow
                    key={slider.key}
                    label={slider.label}
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={selectedLane[slider.key]}
                    onChange={(value) => updateSelectedLaneNumber(slider.key, value)}
                  />
                ))}
              </div>

              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">Lane models</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {MUSIC_BURST_MODEL_SPECS.map((model) => {
                    const checked = selectedLane.models.includes(model.id)

                    return (
                      <label
                        key={model.id}
                        className="flex min-h-9 items-center gap-2 rounded-[7px] border px-2 text-[12px] font-semibold"
                        style={{
                          borderColor: checked ? guideColor : 'rgba(255,255,255,0.2)',
                          background: checked ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.05)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleLaneModel(model.id)}
                          className="accent-white"
                        />
                        {MUSIC_MODEL_LABELS[model.id]}
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1 scrollbar-hide">
            <div className="shrink-0 rounded-[8px] p-4" style={{ background: panelColor }}>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/70">Model previews</p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {MUSIC_BURST_MODEL_SPECS.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => toggleLaneModel(model.id)}
                    className="overflow-hidden rounded-[7px] border border-white/20 bg-black/20 text-left"
                  >
                    <MusicModelPreview
                      model={model}
                      className="h-[92px] w-full"
                    />
                    <span className="block truncate px-2 pb-2 text-[11px] font-bold">{model.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="shrink-0 rounded-[8px] p-4" style={{ background: panelColor }}>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/70">Lane summary</p>
              <div className="mt-3 grid gap-2">
                {lanes.map((lane, index) => (
                  <button
                    key={lane.id}
                    type="button"
                    onClick={() => setSelectedLaneId(lane.id)}
                    className="rounded-[7px] border border-white/20 bg-black/10 p-3 text-left"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-[12px] font-bold uppercase">Lane {index + 1}: {lane.label}</span>
                      <span className="text-[11px] font-semibold text-white/60">{lane.enabled ? 'On' : 'Off'}</span>
                    </span>
                    <span className="mt-1 block truncate text-[11px] text-white/70">
                      {lane.models.map((modelId) => MUSIC_MODEL_LABELS[modelId]).join(', ')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="shrink-0 rounded-[8px] p-4" style={{ background: panelColor }}>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/70">Parameters</p>
              <textarea
                readOnly
                value={exportPayload}
                className="mt-3 h-[130px] w-full resize-none rounded-[7px] border border-white/20 bg-black/25 p-3 font-mono text-[10px] leading-relaxed text-white outline-none"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
