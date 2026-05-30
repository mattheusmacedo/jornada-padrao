export type SpecKeyframe = {
  t: number
  scale?: number
  opacity?: number
  translateX?: number
  translateY?: number
  rotate?: number
  fill?: string
  borderRadius?: number
}

export type SpecLayerInput = {
  id: string
  role: string
  duration_ms: number
  delay_ms: number
  keyframes: SpecKeyframe[]
}

export type SpecSheetDemo = {
  id: string
  category: 'rule' | 'antipattern' | 'sequence'
  title: string
  subtitle: string
  description: string
  duration_ms: number
  easing: 'out' | 'spring'
  keyframes: SpecKeyframe[]
  playerOverride?: { cubicBezier: [number, number, number, number]; label?: string }
  sequence?: { childCount: number; staggerInterval_ms: number; delayChildren_ms: number }
  layers?: SpecLayerInput[]
}

export type MotionSpecPropertyName =
  | 'borderRadius'
  | 'fill'
  | 'opacity'
  | 'rotate'
  | 'scale'
  | 'translateX'
  | 'translateY'

export type MotionSpecSegment = {
  id: string
  type: 'motion' | 'hold'
  label: string
  detail: string
  from: string
  to: string
  startMs: number
  endMs: number
  durationMs: number
}

export type MotionSpecProperty = {
  id: string
  property: MotionSpecPropertyName
  label: string
  valuePath: string
  timingSummary: string
  from: string
  to: string
  startMs: number
  endMs: number
  durationMs: number
  delayMs: number
  easingLabel: string
  color: string
  implementation: string
  segments: MotionSpecSegment[]
}

export type MotionSpecLayer = {
  id: string
  name: string
  role: string
  anchorPoint: string
  rows: MotionSpecProperty[]
}

export type MotionSpecSheet = {
  id: string
  title: string
  component: string
  trigger: string
  variant: string
  anchorPoint: string
  totalDurationMs: number
  durationLabel: string
  easingLabel: string
  easingCurve: [number, number, number, number]
  implementation: string
  notes: string[]
  layers: MotionSpecLayer[]
}

type PropertyKey = MotionSpecPropertyName

const EASING_MAP = {
  out: [0, 0, 0.2, 1] as [number, number, number, number],
  spring: [0.22, 1, 0.36, 1] as [number, number, number, number],
}

const PROPERTY_META: Record<PropertyKey, { color: string; implementation: string; label: string }> = {
  borderRadius: { color: 'var(--color-brand-pink-muted)', implementation: 'borderRadius', label: 'Radius' },
  fill: { color: 'var(--color-brand-orange-normal)', implementation: 'backgroundColor / fill', label: 'Fill color' },
  opacity: { color: 'var(--color-brand-orange-normal)', implementation: 'opacity', label: 'Opacity' },
  rotate: { color: 'var(--color-brand-pink-muted)', implementation: 'rotate', label: 'Rotation' },
  scale: { color: 'var(--color-brand-pink-normal)', implementation: 'transform: scale()', label: 'Scale' },
  translateX: { color: 'var(--color-brand-pink-muted)', implementation: 'transform: translateX()', label: 'X translation' },
  translateY: { color: 'var(--color-brand-brown-dark)', implementation: 'transform: translateY()', label: 'Y translation' },
}

const PROPERTY_ORDER: PropertyKey[] = ['translateX', 'translateY', 'scale', 'opacity', 'rotate', 'fill', 'borderRadius']

const SPEC_OVERRIDES: Record<string, Partial<MotionSpecSheet>> = {
  'tap-button': {
    anchorPoint: 'Center',
    component: 'Button / icon button',
    implementation: 'Framer Motion whileTap + pressTransition',
    notes: ['Must trigger immediately on pointer down.', 'Do not wait for async state or navigation.'],
    trigger: 'Pointer down',
    variant: 'Interaction feedback',
  },
  'press-card-standard': {
    anchorPoint: 'Center',
    component: 'Event card / list item',
    implementation: 'whileTap={pressCardStandard}',
    notes: ['Subtle scale only. Cards should not collapse like buttons.'],
    trigger: 'Pointer down',
    variant: 'Card pressure',
  },
  'press-card-selected': {
    anchorPoint: 'Center',
    component: 'Selected card',
    implementation: 'whileTap={pressCardSelected}',
    notes: ['Selected cards already have emphasis, so pressure is smaller.'],
    trigger: 'Pointer down',
    variant: 'Selected pressure',
  },
  'reveal-popup': {
    anchorPoint: 'Center bottom',
    component: 'Popup / emphasized content',
    implementation: 'revealVariants + revealTransition',
    notes: ['Use for supporting content, not route-level page movement.'],
    trigger: 'Mount / state becomes visible',
    variant: 'Reveal',
  },
  'container-transition': {
    anchorPoint: 'Viewport center',
    component: 'Page or modal container',
    implementation: 'PageTransition',
    notes: ['Spring-like curve is reserved for container motion only.'],
    trigger: 'Route or modal state change',
    variant: 'Container movement',
  },
  'hero-lottie': {
    anchorPoint: 'Center',
    component: 'Hero illustration',
    implementation: 'heroVariants',
    notes: ['Reserved for emotional illustration moments. Do not use this duration for common controls.'],
    trigger: 'Hero mount',
    variant: 'Expressive hero',
  },
  'sequence-list-stagger': {
    anchorPoint: 'Each item center',
    component: 'Event list',
    implementation: 'listVariants + listItemVariants',
    notes: ['Cascading reveal, not a burst. Preserve 50ms stagger rhythm.'],
    trigger: 'List mount',
    variant: 'Staggered sequence',
  },
  'sequence-radio-select': {
    anchorPoint: 'Card center / dot center',
    component: 'Radio selection card',
    implementation: 'Synchronous selected state update',
    notes: ['Background and dot state change together in the same handler.'],
    trigger: 'Selection change',
    variant: 'State change',
  },
  'sequence-conclusion-hero': {
    anchorPoint: 'Illustration center',
    component: 'Conclusion screen hero',
    implementation: 'heroVariants + delayed title reveal',
    notes: ['Title reveal starts during the hero animation, not after it finishes.'],
    trigger: 'Conclusion route mount',
    variant: 'Choreographed hero',
  },
  'sequence-card-detail-flip': {
    anchorPoint: 'Measured source rect',
    component: 'Card to detail transition',
    implementation: 'Measured FLIP shell with source and destination faces',
    notes: ['Shell owns geometry only.', 'Do not mix layoutId, manual FLIP, and corrective crossfade for the same morph.'],
    trigger: 'Open event detail',
    variant: 'Measured morph',
  },
  'anti-mixed-morph-ownership': {
    component: 'Card to detail transition',
    implementation: 'Anti-pattern: competing ownership',
    notes: ['Use this as a failure case to explain why one owner must control the morph.'],
    trigger: 'Open event detail',
    variant: 'Anti-pattern',
  },
}

function formatValue(property: PropertyKey, value: number | string) {
  if (typeof value === 'string') return value
  if (property === 'scale' || property === 'opacity') return `${Math.round(value * 100)}%`
  if (property === 'rotate') return `${value}deg`
  if (property === 'borderRadius' || property === 'translateX' || property === 'translateY') return `${value}px`
  return String(value)
}

function easingFor(demo: SpecSheetDemo) {
  const curve = demo.playerOverride?.cubicBezier ?? EASING_MAP[demo.easing] ?? EASING_MAP.out
  const label = demo.playerOverride?.label ?? (demo.easing === 'spring' ? 'Spring curve' : 'Ease-out')

  return { curve, label }
}

function layerName(layer: SpecLayerInput, fallback: string) {
  if (layer.id === 'hero') return 'Hero illustration'
  if (layer.id === 'title') return 'Title text'
  if (layer.id === 'shell') return 'Morph shell'
  if (layer.id === 'source-face') return 'Source face'
  if (layer.id === 'destination-face') return 'Destination face'
  if (layer.id === 'chrome') return 'Phone chrome'
  return fallback
}

function buildRowsFromKeyframes({
  delayMs,
  durationMs,
  easingLabel,
  keyframes,
  layerId,
}: {
  delayMs: number
  durationMs: number
  easingLabel: string
  keyframes: SpecKeyframe[]
  layerId: string
}) {
  return PROPERTY_ORDER.flatMap((property) => {
    const keyedValues = keyframes
      .filter((keyframe) => keyframe[property] !== undefined)
      .map((keyframe) => ({ t: keyframe.t, value: keyframe[property] as number | string }))

    if (keyedValues.length === 0) return []

    const keyStops = keyedValues.map(({ t, value }) => ({
      atMs: Math.round(delayMs + t * durationMs),
      formatted: formatValue(property, value),
      t,
      value,
    }))
    const first = keyStops[0]
    const last = keyStops[keyStops.length - 1]
    const startMs = Math.round(delayMs + first.t * durationMs)
    const endMs = Math.round(delayMs + last.t * durationMs)
    const propertyMeta = PROPERTY_META[property]
    const valuePath = keyStops
      .map(({ formatted }) => formatted)
      .join(' -> ')
    const segments = keyStops.slice(0, -1).map((stop, index) => {
      const next = keyStops[index + 1]
      const isHold = stop.formatted === next.formatted

      return {
        id: `${layerId}-${property}-${index}`,
        detail: isHold ? `${stop.formatted} held` : `${stop.formatted} -> ${next.formatted}`,
        durationMs: Math.max(0, next.atMs - stop.atMs),
        endMs: next.atMs,
        from: stop.formatted,
        label: isHold ? 'Hold' : propertyMeta.label,
        startMs: stop.atMs,
        to: next.formatted,
        type: isHold ? 'hold' : 'motion',
      } satisfies MotionSpecSegment
    })
    const timingSummary = segments
      .map((segment) => `${segment.label}: ${segment.durationMs}ms`)
      .join(' | ')

    return [{
      id: `${layerId}-${property}`,
      color: propertyMeta.color,
      delayMs: startMs,
      durationMs: Math.max(0, endMs - startMs),
      easingLabel,
      endMs,
      from: first.formatted,
      implementation: propertyMeta.implementation,
      label: propertyMeta.label,
      property,
      segments,
      startMs,
      timingSummary,
      to: last.formatted,
      valuePath,
    }]
  })
}

function buildSequenceRows(demo: SpecSheetDemo, easingLabel: string) {
  if (!demo.sequence) return null

  const childDurationMs = demo.id === 'sequence-list-stagger' ? 200 : demo.duration_ms
  const baseRows = buildRowsFromKeyframes({
    delayMs: demo.sequence.delayChildren_ms,
    durationMs: childDurationMs,
    easingLabel,
    keyframes: demo.keyframes,
    layerId: 'sequence-item',
  })

  return {
    id: 'sequence-item',
    anchorPoint: SPEC_OVERRIDES[demo.id]?.anchorPoint ?? 'Center',
    name: demo.id === 'sequence-list-stagger' ? 'Repeated list item' : 'Sequence item',
    role: `${demo.sequence.childCount} children, ${demo.sequence.staggerInterval_ms}ms stagger`,
    rows: baseRows.map((row) => ({
      ...row,
      id: `sequence-${row.id}`,
    })),
  }
}

function buildPressGestureLayer(demo: SpecSheetDemo, easingLabel: string): MotionSpecLayer | null {
  const scaleStops = demo.keyframes
    .filter((keyframe) => keyframe.scale !== undefined)
    .map((keyframe) => keyframe.scale as number)
  if (scaleStops.length < 2) return null

  const restScale = scaleStops[0]
  const pressedScale = scaleStops.reduce((smallest, scale) => Math.min(smallest, scale), restScale)
  if (pressedScale === restScale) return null

  const pressMs = demo.duration_ms
  const holdMs = 100
  const releaseStartMs = pressMs + holdMs
  const releaseEndMs = releaseStartMs + pressMs
  const propertyMeta = PROPERTY_META.scale
  const restValue = formatValue('scale', restScale)
  const pressedValue = formatValue('scale', pressedScale)
  const segments: MotionSpecSegment[] = [
    {
      id: 'gesture-scale-press',
      detail: `${restValue} -> ${pressedValue}`,
      durationMs: pressMs,
      endMs: pressMs,
      from: restValue,
      label: 'Press in',
      startMs: 0,
      to: pressedValue,
      type: 'motion',
    },
    {
      id: 'gesture-scale-hold',
      detail: `${pressedValue} held while pointer is down`,
      durationMs: holdMs,
      endMs: releaseStartMs,
      from: pressedValue,
      label: 'Hold',
      startMs: pressMs,
      to: pressedValue,
      type: 'hold',
    },
    {
      id: 'gesture-scale-release',
      detail: `${pressedValue} -> ${restValue}`,
      durationMs: pressMs,
      endMs: releaseEndMs,
      from: pressedValue,
      label: 'Release',
      startMs: releaseStartMs,
      to: restValue,
      type: 'motion',
    },
  ]

  return {
    id: 'element',
    anchorPoint: SPEC_OVERRIDES[demo.id]?.anchorPoint ?? 'Center',
    name: SPEC_OVERRIDES[demo.id]?.component ?? 'Interactive element',
    role: demo.category === 'antipattern' ? 'Comparison element' : 'Primary element',
    rows: [{
      id: 'element-scale-gesture',
      color: propertyMeta.color,
      delayMs: 0,
      durationMs: releaseEndMs,
      easingLabel,
      endMs: releaseEndMs,
      from: restValue,
      implementation: propertyMeta.implementation,
      label: propertyMeta.label,
      property: 'scale',
      segments,
      startMs: 0,
      timingSummary: `Press in: ${pressMs}ms | Hold: while pressed | Release: ${pressMs}ms`,
      to: restValue,
      valuePath: `${restValue} -> ${pressedValue} -> ${restValue}`,
    }],
  }
}

export function buildMotionSpec(demo: SpecSheetDemo): MotionSpecSheet {
  const { curve, label } = easingFor(demo)
  const override = SPEC_OVERRIDES[demo.id] ?? {}
  const sequenceLayer = buildSequenceRows(demo, label)
  const pressGestureLayer = buildPressGestureLayer(demo, label)
  const sourceLayers = demo.layers?.length
    ? demo.layers.map((layer) => ({
      id: layer.id,
      anchorPoint: override.anchorPoint ?? 'Center',
      name: layerName(layer, layer.id),
      role: layer.role,
      rows: buildRowsFromKeyframes({
        delayMs: layer.delay_ms,
        durationMs: layer.duration_ms,
        easingLabel: label,
        keyframes: layer.keyframes,
        layerId: layer.id,
      }),
    }))
    : [sequenceLayer ?? pressGestureLayer ?? {
      id: 'element',
      anchorPoint: override.anchorPoint ?? 'Center',
      name: override.component ?? 'Animated element',
      role: demo.category === 'antipattern' ? 'Comparison element' : 'Primary element',
      rows: buildRowsFromKeyframes({
        delayMs: 0,
        durationMs: demo.duration_ms,
        easingLabel: label,
        keyframes: demo.keyframes,
        layerId: 'element',
      }),
    }]
  const layers = sourceLayers.filter((layer): layer is MotionSpecLayer => Boolean(layer))
  const rowMax = layers.flatMap((layer) => layer.rows).reduce((max, row) => Math.max(max, row.endMs), 0)
  const totalDurationMs = Math.max(demo.duration_ms, rowMax)

  return {
    id: demo.id,
    anchorPoint: override.anchorPoint ?? 'Center',
    component: override.component ?? cleanSpecTitle(demo.title),
    durationLabel: pressGestureLayer ? `${demo.duration_ms}ms in/out` : `${totalDurationMs}ms`,
    easingCurve: curve,
    easingLabel: label,
    implementation: override.implementation ?? 'Use tokenized duration/easing from motion-system.json',
    layers,
    notes: override.notes ?? ['Documented from motion-system.json and rendered as a live spec.'],
    title: cleanSpecTitle(demo.title),
    totalDurationMs,
    trigger: override.trigger ?? 'State change',
    variant: override.variant ?? demo.category,
  }
}

function cleanSpecTitle(title: string) {
  return title.replace(/^[^A-Za-z0-9]+/, '').trim()
}
