import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { motion as fmotion } from 'framer-motion'
import { Box, Play, Sparkles } from 'lucide-react'
import { BurstLaneMap } from '../components/BurstLaneMap'
import BezierCurveSVG, { BezierCopyButton } from '../components/motion-docs/BezierCurveSVG'
import { MotionSpecSheet } from '../components/motion-docs/MotionSpecSheet'
import {
  cloneMusicBurstLanes,
  MUSIC_BURST_MODEL_SPECS,
  MUSIC_MODEL_LABELS,
} from '../components/musicBurstConfig'
import type { MusicBurstLaneConfig } from '../components/musicBurstConfig'
import { DEFAULT_MUSIC_NOTE_BURST_SETTINGS } from '../components/musicNotesConfig'
import { localizeDemo, motionDocsCopy } from '../motion/motionDocsCopy'
import type { Locale } from '../motion/motionDocsCopy'
import { buildMotionSpec } from '../motion/specSheet'

type Keyframe = {
  t: number
  scale?: number
  opacity?: number
  translateX?: number
  translateY?: number
  rotate?: number
  fill?: string
  borderRadius?: number
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

const DOC_TYPE = {
  eyebrow: 'text-[11px] font-extrabold uppercase tracking-[0.14em] leading-[1.25]',
  panelLabel: 'text-[11px] font-extrabold uppercase tracking-[0.08em] leading-[1.25]',
  pageTitle: 'text-[40px] font-extrabold leading-[1.08]',
  sectionTitle: 'text-[28px] font-extrabold leading-[1.16]',
  groupTitle: 'text-[22px] font-semibold leading-[1.25]',
  demoTitle: 'text-[18px] font-semibold leading-[1.35]',
  cardTitle: 'text-[16px] font-semibold leading-[1.35]',
  bodyLarge: 'text-[15px] leading-[1.75]',
  body: 'text-[13px] leading-[1.75]',
  bodySmall: 'text-[12px] leading-[1.7]',
  monoSmall: 'font-mono text-[11px] leading-[1.65]',
} as const

const DOC_PANEL = 'rounded-[8px] border border-[var(--color-grey-light-active)] bg-white'

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
    fill: 'var(--color-brand-pink-normal)',
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

function cleanTitle(title: string) {
  return title.replace(/^[^A-Za-z0-9]+/, '').trim()
}

function formatLaneNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

function Canvas({ children, heading, label, onTrigger }: {
  children: ReactNode
  heading: string
  label?: string
  onTrigger?: () => void
}) {
  return (
    <div
      role={onTrigger ? 'button' : undefined}
      tabIndex={onTrigger ? 0 : undefined}
      onPointerDown={onTrigger}
      onKeyDown={onTrigger ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onTrigger()
        }
      } : undefined}
      className={`relative flex h-full min-h-[280px] w-full flex-col overflow-hidden ${DOC_PANEL} ${onTrigger ? 'cursor-pointer outline-none transition-colors duration-150 ease-out focus-visible:border-[var(--color-brand-pink-normal)] focus-visible:ring-2 focus-visible:ring-[var(--color-pink-light)]' : ''}`}
    >
      <div className={`w-full px-4 pt-4 ${DOC_TYPE.panelLabel} text-[var(--color-grey-dark)]`}>
        {heading}
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        {children}
        {label && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase leading-[1.45] tracking-[0.04em] text-[var(--color-grey-normal)]">
            {label}
          </div>
        )}
      </div>
    </div>
  )
}

function SingleCircleDemo({ demo, heading, onTrigger, replayKey }: {
  demo: Demo
  heading: string
  onTrigger: () => void
  replayKey: number
}) {
  const { animate, initial, transition } = buildAnimProps(demo, demo.keyframes, demo.duration_ms)
  return (
    <Canvas heading={heading} label={demo.playerOverride?.label} onTrigger={onTrigger}>
      <fmotion.div
        key={replayKey}
        initial={initial}
        animate={animate}
        transition={transition}
        style={{
          width: CIRCLE_DIAMETER,
          height: CIRCLE_DIAMETER,
          borderRadius: '50%',
          backgroundColor: 'var(--color-brand-pink-normal)',
        }}
      />
    </Canvas>
  )
}

function StaggerDemo({ demo, heading, onTrigger, replayKey }: {
  demo: Demo
  heading: string
  onTrigger: () => void
  replayKey: number
}) {
  const seq = demo.sequence!
  const childDuration_ms = 200
  return (
    <Canvas heading={heading} onTrigger={onTrigger}>
      <div className="flex flex-col items-center gap-2">
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
                backgroundColor: 'var(--color-brand-pink-normal)',
              }}
            />
          )
        })}
      </div>
    </Canvas>
  )
}

function RadioSelectDemo({ demo, heading, locale, onTrigger, replayKey }: {
  demo: Demo
  heading: string
  locale: Locale
  onTrigger: () => void
  replayKey: number
}) {
  const copy = motionDocsCopy[locale]

  return (
    <Canvas heading={heading} onTrigger={onTrigger}>
      <fmotion.div
        key={`${replayKey}-bg`}
        initial={{ backgroundColor: '#FFFFFF' }}
        animate={{ backgroundColor: '#F8F8F8' }}
        transition={{ duration: demo.duration_ms / 1000, ease: EASING_MAP.out }}
        className="flex h-[80px] w-[220px] items-center gap-3 rounded-[8px] border border-[var(--color-grey-light-active)] px-4 shadow-sm"
      >
        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-[var(--color-brand-orange-normal)]">
          <fmotion.span
            key={`${replayKey}-dot`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: demo.duration_ms / 1000, ease: EASING_MAP.out }}
            style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--color-brand-orange-normal)' }}
          />
        </span>
        <div className="flex flex-col">
          <span className="text-[14px] font-medium leading-[1.35] text-[var(--color-grey-darker)]">{copy.radioDemo.title}</span>
          <span className="text-[10px] leading-[1.5] text-[var(--color-grey-dark)]">{copy.radioDemo.subtitle}</span>
        </div>
      </fmotion.div>
    </Canvas>
  )
}

function ConclusionHeroDemo({ demo, heading, onTrigger, replayKey }: {
  demo: Demo
  heading: string
  onTrigger: () => void
  replayKey: number
}) {
  const heroLayer = demo.layers?.find((l) => l.id === 'hero')
  const titleLayer = demo.layers?.find((l) => l.id === 'title')
  if (!heroLayer || !titleLayer) return null

  const heroAnim = buildAnimProps(demo, heroLayer.keyframes, heroLayer.duration_ms, heroLayer.delay_ms)
  const titleAnim = buildAnimProps(demo, titleLayer.keyframes, titleLayer.duration_ms, titleLayer.delay_ms)

  return (
    <Canvas heading={heading} onTrigger={onTrigger}>
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
            backgroundColor: 'var(--color-brand-pink-normal)',
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
            borderRadius: 8,
            backgroundColor: '#404040',
          }}
        />
      </div>
    </Canvas>
  )
}

function DemoPlayer({ demo, heading, locale, onTrigger, replayKey }: {
  demo: Demo
  heading: string
  locale: Locale
  onTrigger: () => void
  replayKey: number
}) {
  if (demo.id === 'sequence-list-stagger') return <StaggerDemo demo={demo} heading={heading} onTrigger={onTrigger} replayKey={replayKey} />
  if (demo.id === 'sequence-radio-select') return <RadioSelectDemo demo={demo} heading={heading} locale={locale} onTrigger={onTrigger} replayKey={replayKey} />
  if (demo.id === 'sequence-conclusion-hero') return <ConclusionHeroDemo demo={demo} heading={heading} onTrigger={onTrigger} replayKey={replayKey} />
  return <SingleCircleDemo demo={demo} heading={heading} onTrigger={onTrigger} replayKey={replayKey} />
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

function BezierPanel({ curve, label, durationMs, locale, replayKey, captionPrefix }: {
  curve: CubicBezier
  label: string
  durationMs: number
  locale: Locale
  replayKey: number
  captionPrefix?: string
}) {
  return (
    <div className={`flex h-full min-h-[280px] w-full flex-col ${DOC_PANEL}`}>
      <div className={`px-4 pt-4 ${DOC_TYPE.panelLabel} text-[var(--color-grey-dark)]`}>
        {captionPrefix}
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-3">
        <BezierCurveSVG cubicBezier={curve} durationMs={durationMs} replayKey={replayKey} size={220} />
      </div>
      <div className="flex items-center justify-between gap-3 px-4 pb-3">
        <code className={`truncate ${DOC_TYPE.monoSmall} text-[var(--color-grey-dark)]`}>{label}</code>
        <BezierCopyButton locale={locale} values={curve} />
      </div>
    </div>
  )
}

function DemoCard({ demo, locale, rule, replayKey, onReplay }: {
  demo: Demo
  locale: Locale
  rule?: Demo
  replayKey: number
  onReplay: () => void
}) {
  const copy = motionDocsCopy[locale]
  const { curve, label } = bezierFor(demo)
  const motionSpec = useMemo(() => buildMotionSpec(demo), [demo])

  return (
    <article className="relative flex flex-col gap-5 rounded-[8px] bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      <button
        type="button"
        onClick={onReplay}
        className="absolute right-6 top-6 flex h-9 items-center gap-2 rounded-[8px] border border-[var(--color-brand-pink-normal)] px-3 text-[12px] font-semibold leading-[1.2] text-[var(--color-brand-pink-normal)]"
      >
        <Play size={14} fill="currentColor" />
        {copy.demoCard.replay}
      </button>

      <div className="grid gap-4 pr-[128px]">
        <h3 className={`${DOC_TYPE.demoTitle} text-[var(--color-grey-darker)]`}>{demo.title}</h3>
        <div className="max-w-none">
          <p className={`${DOC_TYPE.body} text-[var(--color-grey-dark)]`}>{demo.description}</p>
        </div>
      </div>

      <div className="grid items-stretch gap-4 xl:grid-cols-[320px_320px_minmax(0,1fr)] 2xl:grid-cols-[360px_360px_minmax(0,1fr)]">
        <div className="grid content-stretch gap-4">
          {rule ? (
            <>
              <DemoPlayer demo={rule} heading={`${copy.demoCard.rule}: ${cleanTitle(rule.title)}`} locale={locale} onTrigger={onReplay} replayKey={replayKey} />
              <DemoPlayer demo={demo} heading={`${copy.demoCard.avoid}: ${cleanTitle(demo.title)}`} locale={locale} onTrigger={onReplay} replayKey={replayKey} />
            </>
          ) : (
            <DemoPlayer demo={demo} heading={copy.demoCard.interactiveExample} locale={locale} onTrigger={onReplay} replayKey={replayKey} />
          )}
        </div>
        <BezierPanel
          curve={curve}
          label={label}
          durationMs={demo.duration_ms}
          locale={locale}
          replayKey={replayKey}
          captionPrefix={`${copy.demoCard.bezierCurve} ${demo.playerOverride?.label ?? demo.easing}`}
        />
        <MotionSpecSheet locale={locale} spec={motionSpec} />
      </div>
    </article>
  )
}

function DemoSection({ title, demos, demosById, locale, replayKey, bumpReplay }: {
  title: string
  demos: Demo[]
  demosById: Map<string, Demo>
  locale: Locale
  replayKey: number
  bumpReplay: () => void
}) {
  if (demos.length === 0) return null
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h3 className={`${DOC_TYPE.groupTitle} text-[var(--color-grey-darker)]`}>{title}</h3>
      </div>
      <div className="grid gap-4">
        {demos.map((d) => (
          <DemoCard
            key={d.id}
            demo={d}
            locale={locale}
            rule={d.compareWith ? demosById.get(d.compareWith) : undefined}
            replayKey={replayKey}
            onReplay={bumpReplay}
          />
        ))}
      </div>
    </section>
  )
}

function SectionHeader({ eyebrow, title, children }: {
  eyebrow?: string
  title: string
  children?: ReactNode
}) {
  return (
    <div>
      {eyebrow && (
        <p className={`${DOC_TYPE.eyebrow} text-[var(--color-brand-pink-normal)]`}>{eyebrow}</p>
      )}
      <h2 className={`mt-2 ${DOC_TYPE.sectionTitle} text-[var(--color-grey-darker)]`}>{title}</h2>
      {children && <p className={`mt-3 max-w-[820px] ${DOC_TYPE.body} text-[var(--color-grey-dark-active)]`}>{children}</p>}
    </div>
  )
}

function SystemRules({ locale, spec }: { locale: Locale; spec: Spec }) {
  const copy = motionDocsCopy[locale]
  const durationEntries = Object.entries(spec.tokens.durations)

  return (
    <section id="system" className="flex flex-col gap-6">
      <SectionHeader eyebrow={copy.system.eyebrow} title={copy.system.title}>
        {copy.system.intro}
      </SectionHeader>

      <div className={`${DOC_PANEL} p-5`}>
        <h3 className={`${DOC_TYPE.cardTitle} text-[var(--color-grey-darker)]`}>{copy.system.tokenBands}</h3>
        <div className="mt-4 grid gap-2">
          {durationEntries.map(([name, value]) => (
            <div key={name} className="grid grid-cols-[120px_1fr_72px] items-center gap-3 text-[13px] leading-[1.45]">
              <span className="font-mono text-[var(--color-grey-darker)]">{name}</span>
              <span className="h-2 overflow-hidden rounded-full bg-[var(--color-grey-light-active)]">
                <span
                  className="block h-full rounded-full bg-[var(--color-brand-pink-normal)]"
                  style={{ width: `${Math.min(100, (value / 800) * 100)}%` }}
                />
              </span>
              <span className="text-right font-semibold text-[var(--color-grey-dark-active)]">{value}ms</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function StateMachineSection({ locale }: { locale: Locale }) {
  const copy = motionDocsCopy[locale].stateMachine

  return (
    <section id="state-machine" className="flex flex-col gap-6">
      <SectionHeader eyebrow={copy.eyebrow} title={copy.title}>
        {copy.intent}
      </SectionHeader>

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className={`${DOC_PANEL} p-6`}>
          <p className={`${DOC_TYPE.eyebrow} text-[var(--color-brand-pink-normal)]`}>{copy.stateFlow}</p>
          <div className="mt-4 grid gap-3">
            {copy.states.map((state, index) => (
              <div key={state.label} className="grid grid-cols-[34px_1fr] gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--color-pink-light)] text-[13px] font-bold text-[var(--color-brand-pink-normal)]">
                  {index + 1}
                </span>
                <div className="rounded-[8px] border border-[var(--color-grey-light-active)] bg-[var(--color-grey-light)] p-4">
                  <h3 className="text-[14px] font-semibold leading-[1.4] text-[var(--color-grey-darker)]">{state.label}</h3>
                  <p className={`mt-2 ${DOC_TYPE.bodySmall} text-[var(--color-grey-dark-active)]`}>{state.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${DOC_PANEL} p-6`}>
          <h3 className={`${DOC_TYPE.cardTitle} text-[var(--color-grey-darker)]`}>{copy.transitionTable}</h3>
          <div className="mt-4 overflow-x-auto">
            <table className={`w-full min-w-[720px] border-collapse text-left ${DOC_TYPE.bodySmall}`}>
              <thead>
                <tr className="border-b border-[var(--color-grey-light-active)] text-[11px] uppercase tracking-[0.08em] text-[var(--color-grey-dark)]">
                  {copy.columns.map((column) => (
                    <th key={column} className="py-2 pr-3 last:pr-0">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {copy.transitions.map((transition) => (
                  <tr key={`${transition.event}-${transition.from}`} className="border-b border-[var(--color-grey-light-active)] align-top">
                    <td className="py-3 pr-3 font-mono font-semibold text-[var(--color-brand-pink-normal)]">{transition.event}</td>
                    <td className="py-3 pr-3 text-[var(--color-grey-dark-active)]">{transition.from}</td>
                    <td className="py-3 pr-3 text-[var(--color-grey-darker)]">{transition.to}</td>
                    <td className="py-3 pr-3 text-[var(--color-grey-dark-active)]">{transition.guard}</td>
                    <td className="py-3 text-[var(--color-grey-dark-active)]">{transition.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {copy.guardrails.map((guardrail) => (
              <p key={guardrail} className={`rounded-[8px] bg-[var(--color-grey-light)] p-3 ${DOC_TYPE.bodySmall} text-[var(--color-grey-dark-active)]`}>
                {guardrail}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function LaneMetric({ label, value }: { label: string; value: number }) {
  return (
    <span className={`flex items-center justify-between gap-3 rounded-[8px] bg-[var(--color-grey-light)] px-3 py-2 ${DOC_TYPE.bodySmall}`}>
      <span className="font-semibold text-[var(--color-grey-dark)]">{label}</span>
      <span className="font-mono text-[var(--color-grey-darker)]">{formatLaneNumber(value)}</span>
    </span>
  )
}

function LaneDetail({ lane, locale }: { lane: MusicBurstLaneConfig; locale: Locale }) {
  const copy = motionDocsCopy[locale].burst
  const metrics = [
    ['x', lane.x],
    ['y', lane.y],
    ['curveX', lane.curveX],
    ['curveY', lane.curveY],
    ['spreadX', lane.spreadX],
    ['spreadY', lane.spreadY],
    ['scale', lane.scale],
    ['speed', lane.speed],
    ['depth', lane.depth],
    ['lift', lane.lift],
    ['spin', lane.spin],
  ] as const

  return (
    <div className={`${DOC_PANEL} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`${DOC_TYPE.eyebrow} text-[var(--color-grey-dark)]`}>{copy.selectedLane}</p>
          <h3 className="mt-2 text-[20px] font-bold leading-[1.25] text-[var(--color-grey-darker)]">{lane.label}</h3>
        </div>
        <span className="rounded-[8px] bg-[var(--color-pink-light)] px-3 py-2 text-[12px] font-semibold text-[var(--color-brand-pink-normal)]">
          {lane.enabled ? copy.enabled : copy.disabled}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {metrics.map(([label, value]) => (
          <LaneMetric key={label} label={label} value={value} />
        ))}
      </div>
      <div className="mt-4">
        <p className={`${DOC_TYPE.eyebrow} text-[var(--color-grey-dark)]`}>{copy.modelCycle}</p>
        <p className={`mt-3 ${DOC_TYPE.body} text-[var(--color-grey-dark-active)]`}>
          {lane.models.map((modelId) => MUSIC_MODEL_LABELS[modelId]).join(', ')}
        </p>
      </div>
    </div>
  )
}

function BurstLogicSection({ locale }: { locale: Locale }) {
  const copy = motionDocsCopy[locale].burst
  const lanes = useMemo(() => cloneMusicBurstLanes(), [])
  const [selectedLaneId, setSelectedLaneId] = useState(() => lanes[0]?.id ?? '')
  const selectedLane = lanes.find((lane) => lane.id === selectedLaneId) ?? lanes[0]

  return (
    <section id="burst" className="flex flex-col gap-6">
      <SectionHeader eyebrow={copy.eyebrow} title={copy.title}>
        {copy.intro}
      </SectionHeader>

      <div className="grid gap-4 lg:grid-cols-[minmax(320px,460px)_1fr]">
        <div className="rounded-[8px] bg-[var(--color-grey-darker)] p-5 text-white">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={`${DOC_TYPE.eyebrow} text-white/62`}>{copy.productionMap}</p>
              <h3 className="mt-2 text-[20px] font-bold leading-[1.25]">{copy.productionSubtitle}</h3>
            </div>
            <Sparkles size={22} />
          </div>
          <BurstLaneMap
            color="#ffffff"
            lanes={lanes}
            onSelectLane={setSelectedLaneId}
            selectedLaneId={selectedLane.id}
            className="mt-4 aspect-[390/720] min-h-[420px] rounded-[8px] bg-[var(--color-brand-pink-normal)]"
          />
        </div>

        <div className="grid gap-4">
          <LaneDetail lane={selectedLane} locale={locale} />
          <div className={`${DOC_PANEL} p-5`}>
            <h3 className={`${DOC_TYPE.cardTitle} text-[var(--color-grey-darker)]`}>{copy.contract}</h3>
            <p className={`mt-3 font-mono ${DOC_TYPE.bodySmall} text-[var(--color-grey-dark-active)]`}>{copy.trigger}</p>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {copy.constants.map((constant) => (
                <div key={constant.label} className="rounded-[8px] bg-[var(--color-grey-light)] p-3">
                  <p className={`${DOC_TYPE.body} font-semibold text-[var(--color-grey-darker)]`}>{constant.label}</p>
                  <p className={`mt-2 ${DOC_TYPE.bodySmall} text-[var(--color-grey-dark-active)]`}>{constant.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              {Object.entries(DEFAULT_MUSIC_NOTE_BURST_SETTINGS).map(([key, value]) => (
                <div key={key} className="rounded-[8px] border border-[var(--color-grey-light-active)] px-2 py-3">
                  <p className="text-[11px] font-semibold uppercase leading-[1.35] tracking-[0.08em] text-[var(--color-grey-dark)]">{key}</p>
                  <p className="mt-1 font-mono text-[16px] font-bold text-[var(--color-grey-darker)]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className={`${DOC_PANEL} p-5`}>
          <h3 className={`${DOC_TYPE.cardTitle} text-[var(--color-grey-darker)]`}>{copy.algorithmNotes}</h3>
          <ol className="mt-4 grid gap-2">
            {copy.algorithm.map((step, index) => (
              <li key={step} className={`grid grid-cols-[28px_1fr] gap-3 ${DOC_TYPE.body} text-[var(--color-grey-dark-active)]`}>
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[var(--color-pink-light)] font-bold text-[var(--color-brand-pink-normal)]">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className={`${DOC_PANEL} p-5`}>
          <h3 className={`${DOC_TYPE.cardTitle} text-[var(--color-grey-darker)]`}>{copy.laneInventory}</h3>
          <p className={`mt-3 ${DOC_TYPE.body} text-[var(--color-grey-dark-active)]`}>
            {copy.laneInventorySummary(lanes.length, MUSIC_BURST_MODEL_SPECS.length)}
          </p>
          <div className="mt-4 grid max-h-[360px] gap-2 overflow-y-auto pr-1 scrollbar-hide">
            {lanes.map((lane, index) => (
              <button
                key={lane.id}
                type="button"
                onClick={() => setSelectedLaneId(lane.id)}
                className="rounded-[8px] border border-[var(--color-grey-light-active)] bg-[var(--color-grey-light)] p-3 text-left"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-[12px] font-bold uppercase leading-[1.45] text-[var(--color-grey-darker)]">Lane {index + 1}: {lane.label}</span>
                  <span className="text-[11px] font-semibold text-[var(--color-grey-dark)]">{lane.enabled ? copy.on : copy.off}</span>
                </span>
                <span className="mt-2 block truncate text-[11px] leading-[1.45] text-[var(--color-grey-dark-active)]">
                  {lane.models.slice(0, 4).map((modelId) => MUSIC_MODEL_LABELS[modelId]).join(', ')}...
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function LanguageToggle({ locale, onChange }: { locale: Locale; onChange: (locale: Locale) => void }) {
  return (
    <div className="flex h-11 overflow-hidden rounded-[8px] border border-[var(--color-grey-normal)] bg-white">
      {(['pt', 'en'] as const).map((option) => {
        const selected = locale === option

        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option)}
            className={`min-w-11 px-3 text-[12px] font-extrabold uppercase leading-[1.2] transition-colors duration-150 ease-out ${
              selected
                ? 'bg-[var(--color-brand-pink-normal)] text-white'
                : 'text-[var(--color-grey-dark-active)] hover:bg-[var(--color-grey-light)] hover:text-[var(--color-brand-pink-normal)]'
            }`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

export default function MotionDocs() {
  const [spec, setSpec] = useState<Spec | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [locale, setLocale] = useState<Locale>('pt')
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

  useEffect(() => {
    document.documentElement.lang = locale === 'pt' ? 'pt-BR' : 'en'
  }, [locale])

  if (error) {
    const copy = motionDocsCopy[locale]

    return (
      <div className="min-h-screen w-full bg-[var(--color-grey-light)] p-10 text-[var(--color-grey-darker)]">
        {copy.loadError}: {error}
      </div>
    )
  }
  if (!spec) {
    const copy = motionDocsCopy[locale]

    return (
      <div className="min-h-screen w-full bg-[var(--color-grey-light)] p-10 text-[var(--color-grey-darker)]">
        {copy.loading}
      </div>
    )
  }

  const copy = motionDocsCopy[locale]
  const localizedDemos = spec.demos.map((demo) => localizeDemo(demo, locale))
  const demosById = new Map(localizedDemos.map((d) => [d.id, d]))
  const rules = localizedDemos.filter((d) => d.category === 'rule')
  const antipatterns = localizedDemos.filter((d) => d.category === 'antipattern')
  const sequences = localizedDemos.filter((d) => d.category === 'sequence')

  return (
    <div lang={locale === 'pt' ? 'pt-BR' : 'en'} className="min-h-screen w-full bg-[var(--color-grey-light)]">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-14 px-5 py-10 md:px-8">
        <header className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className={`${DOC_TYPE.eyebrow} text-[var(--color-brand-pink-normal)]`}>{copy.header.eyebrow}</p>
              <h1 className={`mt-3 max-w-[760px] ${DOC_TYPE.pageTitle} text-[var(--color-grey-darker)]`}>
                {copy.header.title}
              </h1>
              <p className={`mt-4 max-w-[820px] ${DOC_TYPE.bodyLarge} text-[var(--color-grey-dark-active)]`}>
                {copy.header.summary(spec.version, spec.composition.width, spec.composition.height, spec.composition.fps, spec.demos.length)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <LanguageToggle locale={locale} onChange={setLocale} />
              <a
                href="/burst-sandbox"
                className="flex h-11 items-center gap-2 rounded-[8px] border border-[var(--color-grey-normal)] bg-white px-4 text-[13px] font-bold text-[var(--color-grey-darker)]"
              >
                <Sparkles size={16} />
                {copy.header.burstSandbox}
              </a>
              <a
                href="/model-sandbox"
                className="flex h-11 items-center gap-2 rounded-[8px] border border-[var(--color-grey-normal)] bg-white px-4 text-[13px] font-bold text-[var(--color-grey-darker)]"
              >
                <Box size={16} />
                {copy.header.modelSandbox}
              </a>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2 border-y border-[var(--color-grey-light-active)] py-3">
            {copy.nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-[8px] px-3 py-2 text-[12px] font-semibold text-[var(--color-grey-dark-active)] transition-colors duration-150 ease-out hover:bg-white hover:text-[var(--color-brand-pink-normal)]"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </header>

        <SystemRules locale={locale} spec={spec} />

        <section id="demos" className="flex flex-col gap-9">
          <SectionHeader eyebrow={copy.demos.eyebrow} title={copy.demos.title}>
            {copy.demos.intro}
          </SectionHeader>
          <DemoSection title={copy.demos.groups.rule} demos={rules} demosById={demosById} locale={locale} replayKey={replayKey} bumpReplay={() => setReplayKey((k) => k + 1)} />
          <DemoSection title={copy.demos.groups.antipattern} demos={antipatterns} demosById={demosById} locale={locale} replayKey={replayKey} bumpReplay={() => setReplayKey((k) => k + 1)} />
          <DemoSection title={copy.demos.groups.sequence} demos={sequences} demosById={demosById} locale={locale} replayKey={replayKey} bumpReplay={() => setReplayKey((k) => k + 1)} />
        </section>

        <StateMachineSection locale={locale} />
        <BurstLogicSection locale={locale} />
      </div>
    </div>
  )
}
