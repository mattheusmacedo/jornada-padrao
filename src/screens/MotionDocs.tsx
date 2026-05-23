import { useEffect, useState } from 'react'
import { motion as fmotion } from 'framer-motion'
import BezierCurveSVG, { BezierCopyButton } from '../components/motion-docs/BezierCurveSVG'

type Keyframe = {
  t: number
  scale?: number
  opacity?: number
  translateX?: number
  translateY?: number
  rotate?: number
  fill?: string
}

type Layer = {
  id: string
  role: string
  duration_ms: number
  delay_ms: number
  keyframes: Keyframe[]
}

type Demo = {
  id: string
  category: 'rule' | 'antipattern' | 'sequence'
  title: string
  subtitle: string
  description: string
  duration_ms: number
  easing: 'out' | 'spring'
  keyframes: Keyframe[]
  compareWith?: string
  playerOverride?: { cubicBezier: [number, number, number, number]; label?: string }
  sequence?: { childCount: number; staggerInterval_ms: number; delayChildren_ms: number }
  layers?: Layer[]
}

type Spec = {
  version: string
  composition: { width: number; height: number; fps: number }
  referenceShape: { type: string; radius: number; color: string }
  background: string
  tokens: {
    durations: Record<string, number>
    easings: Record<string, { name: string; cubicBezier: [number, number, number, number] }>
  }
  demos: Demo[]
}

const PREVIEW_SIZE = 300
const COMP_SIZE = 1080
const SCALE_RATIO = COMP_SIZE / PREVIEW_SIZE
const CIRCLE_DIAMETER = 80
const EASING_MAP: Record<string, [number, number, number, number]> = {
  out: [0, 0, 0.2, 1],
  spring: [0.22, 1, 0.36, 1],
}

type CubicBezier = [number, number, number, number]
type AnimMap = Record<string, (number | string)[] | number | string>

type AnimPropsResult = {
  animate: AnimMap
  initial: Record<string, number | string>
  transition: { duration: number; ease: CubicBezier; times: number[]; delay?: number }
}

function buildAnimProps(demo: Demo, kfs: Keyframe[], duration_ms: number, delay_ms = 0): AnimPropsResult {
  const times = kfs.map((k) => k.t)
  const defaults: Record<string, number | string> = {
    scale: 1,
    opacity: 1,
    translateX: 0,
    translateY: 0,
    rotate: 0,
    fill: '#E8176B',
  }
  const props = ['scale', 'opacity', 'translateX', 'translateY', 'rotate', 'fill'] as const

  const animate: AnimMap = {}
  const initial: Record<string, number | string> = {}

  for (const p of props) {
    const isSet = kfs.some((k) => k[p] !== undefined)
    if (!isSet) continue
    let last: number | string = defaults[p]
    const arr = kfs.map((k) => {
      let v = k[p]
      if (v === undefined) return last
      if ((p === 'translateX' || p === 'translateY') && typeof v === 'number') {
        v = v / SCALE_RATIO
      }
      last = v as number | string
      return v
    })
    const fmKey =
      p === 'translateX'
        ? 'x'
        : p === 'translateY'
          ? 'y'
          : p === 'fill'
            ? 'backgroundColor'
            : p
    animate[fmKey] = arr
    initial[fmKey] = arr[0]
  }

  const easingArr = demo.playerOverride?.cubicBezier ?? EASING_MAP[demo.easing] ?? EASING_MAP.out

  return {
    animate,
    initial,
    transition: { duration: duration_ms / 1000, ease: easingArr, times, delay: delay_ms / 1000 },
  }
}

function Canvas({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="relative w-[300px] h-[300px] rounded-2xl bg-white border border-[var(--color-grey-light-active)] flex items-center justify-center overflow-hidden">
      {children}
      {label && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.5px] text-[var(--color-grey-normal)] font-medium">
          {label}
        </div>
      )}
    </div>
  )
}

function SingleCircleDemo({ demo, replayKey }: { demo: Demo; replayKey: number }) {
  const { animate, initial, transition } = buildAnimProps(demo, demo.keyframes, demo.duration_ms)
  return (
    <Canvas label={demo.playerOverride?.label}>
      <fmotion.div
        key={replayKey}
        initial={initial}
        animate={animate}
        transition={transition}
        style={{
          width: CIRCLE_DIAMETER,
          height: CIRCLE_DIAMETER,
          borderRadius: '50%',
          backgroundColor: '#E8176B',
        }}
      />
    </Canvas>
  )
}

function StaggerDemo({ demo, replayKey }: { demo: Demo; replayKey: number }) {
  const seq = demo.sequence!
  const childDuration_ms = 200
  return (
    <Canvas>
      <div className="flex flex-col gap-2 items-center">
        {Array.from({ length: seq.childCount }).map((_, i) => {
          const delay = seq.delayChildren_ms + i * seq.staggerInterval_ms
          const { animate, initial, transition } = buildAnimProps(demo, demo.keyframes, childDuration_ms, delay)
          return (
            <fmotion.div
              key={`${replayKey}-${i}`}
              initial={initial}
              animate={animate}
              transition={transition}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#E8176B',
              }}
            />
          )
        })}
      </div>
    </Canvas>
  )
}

function RadioSelectDemo({ demo, replayKey }: { demo: Demo; replayKey: number }) {
  // bg color morphs (white → orange-light), inner dot scales 0→1 with orange fill
  return (
    <Canvas>
      <fmotion.div
        key={`${replayKey}-bg`}
        initial={{ backgroundColor: '#FFFFFF' }}
        animate={{ backgroundColor: '#FFF3E6' }}
        transition={{ duration: demo.duration_ms / 1000, ease: EASING_MAP.out }}
        className="w-[220px] h-[80px] rounded-2xl border border-[var(--color-grey-light-active)] shadow-sm flex items-center px-4 gap-3"
      >
        <span className="w-[22px] h-[22px] rounded-full border-2 border-[var(--color-orange-normal)] flex items-center justify-center">
          <fmotion.span
            key={`${replayKey}-dot`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: demo.duration_ms / 1000, ease: EASING_MAP.out }}
            style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FF8800' }}
          />
        </span>
        <div className="flex flex-col">
          <span className="text-[14px] font-medium text-[var(--color-grey-darker)] leading-tight">Shows salvos</span>
          <span className="text-[10px] text-[#6d6d6d] leading-tight">Aqueles que você precisa ir</span>
        </div>
      </fmotion.div>
    </Canvas>
  )
}

function ConclusionHeroDemo({ demo, replayKey }: { demo: Demo; replayKey: number }) {
  const heroLayer = demo.layers?.find((l) => l.id === 'hero')
  const titleLayer = demo.layers?.find((l) => l.id === 'title')
  if (!heroLayer || !titleLayer) return null

  const heroAnim = buildAnimProps(demo, heroLayer.keyframes, heroLayer.duration_ms, heroLayer.delay_ms)
  const titleAnim = buildAnimProps(demo, titleLayer.keyframes, titleLayer.duration_ms, titleLayer.delay_ms)

  return (
    <Canvas>
      <div className="flex flex-col items-center gap-4">
        <fmotion.div
          key={`${replayKey}-hero`}
          initial={heroAnim.initial}
          animate={heroAnim.animate}
          transition={heroAnim.transition}
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            backgroundColor: '#E8176B',
          }}
        />
        <fmotion.div
          key={`${replayKey}-title`}
          initial={titleAnim.initial}
          animate={titleAnim.animate}
          transition={titleAnim.transition}
          style={{
            width: 160,
            height: 14,
            borderRadius: 7,
            backgroundColor: '#404040',
          }}
        />
      </div>
    </Canvas>
  )
}

function pickPlayer(demo: Demo) {
  if (demo.id === 'sequence-list-stagger') return StaggerDemo
  if (demo.id === 'sequence-radio-select') return RadioSelectDemo
  if (demo.id === 'sequence-conclusion-hero') return ConclusionHeroDemo
  return SingleCircleDemo
}

function bezierFor(demo: Demo): { curve: CubicBezier; label: string } {
  if (demo.playerOverride?.cubicBezier) {
    return {
      curve: demo.playerOverride.cubicBezier,
      label: `cubic-bezier(${demo.playerOverride.cubicBezier.join(', ')})`,
    }
  }
  const curve = EASING_MAP[demo.easing] ?? EASING_MAP.out
  return { curve, label: `cubic-bezier(${curve.join(', ')})` }
}

function BezierPanel({ curve, label, durationMs, replayKey, captionPrefix }: {
  curve: CubicBezier
  label: string
  durationMs: number
  replayKey: number
  captionPrefix?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      {captionPrefix && (
        <span className="text-[11px] uppercase tracking-[0.5px] text-[var(--color-grey-dark)] font-semibold">
          {captionPrefix}
        </span>
      )}
      <BezierCurveSVG cubicBezier={curve} durationMs={durationMs} replayKey={replayKey} size={PREVIEW_SIZE} />
      <div className="flex items-center justify-between gap-3">
        <code className="font-mono text-[11px] text-[var(--color-grey-dark)] truncate">{label}</code>
        <BezierCopyButton values={curve} />
      </div>
    </div>
  )
}

function DemoCard({ demo, rule, replayKey, onReplay }: {
  demo: Demo
  rule?: Demo
  replayKey: number
  onReplay: () => void
}) {
  const PlayerSelf = pickPlayer(demo)
  const PlayerRule = rule ? pickPlayer(rule) : null
  const { curve, label } = bezierFor(demo)

  return (
    <div className="rounded-2xl bg-[var(--color-grey-light)] p-6 flex flex-col gap-4">
      <div>
        <h3 className="text-[18px] font-medium text-[var(--color-grey-darker)] leading-tight">{demo.title}</h3>
        <p className="mt-1 text-[13px] text-[var(--color-grey-dark-active)]">{demo.subtitle}</p>
        <p className="mt-2 text-[13px] leading-snug text-[var(--color-grey-dark)] max-w-[640px]">{demo.description}</p>
      </div>

      <div className="flex flex-wrap gap-4 items-start">
        {rule && PlayerRule ? (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-[0.5px] text-[var(--color-grey-dark)] font-semibold">
                ✓ {rule.title.replace(/^[^\w]+/, '').trim()}
              </span>
              <PlayerRule demo={rule} replayKey={replayKey} />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-[0.5px] text-[var(--color-pink-normal)] font-semibold">
                ❌ {demo.title.replace(/^[^\w]+/, '').trim()}
              </span>
              <PlayerSelf demo={demo} replayKey={replayKey} />
            </div>
            <BezierPanel
              curve={curve}
              label={label}
              durationMs={demo.duration_ms}
              replayKey={replayKey}
              captionPrefix={`Curva ${demo.playerOverride?.label ?? demo.easing}`}
            />
          </>
        ) : (
          <>
            <PlayerSelf demo={demo} replayKey={replayKey} />
            <BezierPanel
              curve={curve}
              label={label}
              durationMs={demo.duration_ms}
              replayKey={replayKey}
            />
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onReplay}
        className="self-start text-[12px] uppercase tracking-[0.5px] font-medium text-[var(--color-pink-normal)] border border-[var(--color-pink-normal)] rounded-full px-4 py-2"
      >
        Replay
      </button>
    </div>
  )
}

function Section({ title, demos, demosById, replayKey, bumpReplay }: {
  title: string
  demos: Demo[]
  demosById: Map<string, Demo>
  replayKey: number
  bumpReplay: () => void
}) {
  if (demos.length === 0) return null
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-[24px] font-medium text-[var(--color-grey-darker)]">{title}</h2>
      <div className="flex flex-col gap-4">
        {demos.map((d) => (
          <DemoCard
            key={d.id}
            demo={d}
            rule={d.compareWith ? demosById.get(d.compareWith) : undefined}
            replayKey={replayKey}
            onReplay={bumpReplay}
          />
        ))}
      </div>
    </section>
  )
}

export default function MotionDocs() {
  const [spec, setSpec] = useState<Spec | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [replayKey, setReplayKey] = useState(0)

  useEffect(() => {
    fetch('/motion-system.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: Spec) => setSpec(data))
      .catch((e: Error) => setError(e.message))
  }, [])

  if (error) {
    return (
      <div className="min-h-screen w-full bg-[var(--color-grey-light)] p-10 text-[var(--color-grey-darker)]">
        Falha ao carregar motion-system.json: {error}
      </div>
    )
  }
  if (!spec) {
    return (
      <div className="min-h-screen w-full bg-[var(--color-grey-light)] p-10 text-[var(--color-grey-darker)]">
        Carregando spec do sistema de motion…
      </div>
    )
  }

  const demosById = new Map(spec.demos.map((d) => [d.id, d]))
  const rules = spec.demos.filter((d) => d.category === 'rule')
  const antipatterns = spec.demos.filter((d) => d.category === 'antipattern')
  const sequences = spec.demos.filter((d) => d.category === 'sequence')

  return (
    <div className="min-h-screen w-full bg-[var(--color-grey-light)]">
      <div className="max-w-[1200px] mx-auto px-6 py-12 flex flex-col gap-10">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[34px] font-extrabold text-[var(--color-grey-darker)] leading-none">
              Referência do Sistema de Motion
            </h1>
            <p className="mt-2 text-[14px] text-[var(--color-grey-dark)]">
              Spec v{spec.version} · {spec.composition.width}×{spec.composition.height} @ {spec.composition.fps}fps · {spec.demos.length} demos
            </p>
            <p className="mt-2 text-[13px] text-[var(--color-grey-dark-active)] max-w-[640px]">
              Source of truth fica em <code>2_SOURCE/footages/JSON/motion-system.json</code> — sincronizado para <code>public/</code> no dev/build. Traduzível para arquivos Lottie .json via script de export futuro.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReplayKey((k) => k + 1)}
            className="shrink-0 text-[12px] uppercase tracking-[0.5px] font-medium text-white bg-[var(--color-pink-normal)] rounded-full px-5 py-3"
          >
            Tocar tudo novamente
          </button>
        </header>

        <Section title="Regras" demos={rules} demosById={demosById} replayKey={replayKey} bumpReplay={() => setReplayKey((k) => k + 1)} />
        <Section title="Anti-padrões" demos={antipatterns} demosById={demosById} replayKey={replayKey} bumpReplay={() => setReplayKey((k) => k + 1)} />
        <Section title="Sequências" demos={sequences} demosById={demosById} replayKey={replayKey} bumpReplay={() => setReplayKey((k) => k + 1)} />
      </div>
    </div>
  )
}
