// Translates motion-system.json into Lottie 5.7.x JSON files (one per demo).
// Usage:
//   node scripts/export-lottie.mjs                # generate all 13
//   node scripts/export-lottie.mjs --only tap-button  # generate just one
//
// Source spec:  D:/05_MotionDesignParaProdutoDigital/2_SOURCE/footages/JSON/motion-system.json
// Output dir:   D:/05_MotionDesignParaProdutoDigital/2_SOURCE/footages/JSON/lottie/

import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SRC = resolve(__dirname, '../../2_SOURCE/footages/JSON/motion-system.json')
const OUT_DIR = resolve(__dirname, '../../2_SOURCE/footages/JSON/lottie')

// ── CLI ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const onlyIdx = args.indexOf('--only')
const onlyId = onlyIdx !== -1 ? args[onlyIdx + 1] : null

// ── Constants ───────────────────────────────────────────────────────────────
const COMP_WIDTH = 1080
const COMP_HEIGHT = 1080
const COMP_FPS = 60
const COMP_CENTER = [COMP_WIDTH / 2, COMP_HEIGHT / 2, 0]
const PINK_HEX = '#E8176B'
const CIRCLE_DIAMETER = 400 // radius 200 in spec → diameter 400

// Lottie tangent presets per easing name.
// For multi-dim animations, single-entry tangent arrays get broadcast.
const EASING_TANGENTS = {
  out: { i: { x: [0.2], y: [1] }, o: { x: [0], y: [0] } },
  spring: { i: { x: [0.36], y: [1] }, o: { x: [0.22], y: [1] } },
  'ease-in-out': { i: { x: [0.58], y: [1] }, o: { x: [0.42], y: [0] } },
}

function bezierToTangents(cubicBezier) {
  // cubicBezier: [x1, y1, x2, y2]
  return {
    i: { x: [cubicBezier[2]], y: [cubicBezier[3]] },
    o: { x: [cubicBezier[0]], y: [cubicBezier[1]] },
  }
}

function easingFor(demo) {
  if (demo.playerOverride?.cubicBezier) return bezierToTangents(demo.playerOverride.cubicBezier)
  return EASING_TANGENTS[demo.easing] ?? EASING_TANGENTS.out
}

function toFrames(t, duration_ms) {
  return Math.round(t * duration_ms * COMP_FPS / 1000)
}

function hexToRgb01(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  // Round to 4 decimals for readability
  return [+r.toFixed(4), +g.toFixed(4), +b.toFixed(4), 1]
}

// ── Property builders ───────────────────────────────────────────────────────
// All return a Lottie property object: { a: 0|1, k: ... }

function staticScale100() {
  return { a: 0, k: [100, 100, 100] }
}
function staticOpacity100() {
  return { a: 0, k: 100 }
}
function staticRotation0() {
  return { a: 0, k: 0 }
}
function staticAnchor0() {
  return { a: 0, k: [0, 0, 0] }
}
function staticPositionCenter() {
  return { a: 0, k: COMP_CENTER.slice() }
}

function buildScaleAnim(kfs, duration_ms, tangents) {
  const hasScale = kfs.some((k) => k.scale !== undefined)
  if (!hasScale) return staticScale100()
  let last = 1
  const points = kfs.map((k) => {
    const v = k.scale !== undefined ? k.scale : last
    last = v
    return { t: toFrames(k.t, duration_ms), s: [v * 100, v * 100, 100] }
  })
  return wrapKeyframes(points, tangents)
}

function buildOpacityAnim(kfs, duration_ms, tangents) {
  const hasOpacity = kfs.some((k) => k.opacity !== undefined)
  if (!hasOpacity) return staticOpacity100()
  let last = 1
  const points = kfs.map((k) => {
    const v = k.opacity !== undefined ? k.opacity : last
    last = v
    return { t: toFrames(k.t, duration_ms), s: [v * 100] }
  })
  return wrapKeyframes(points, tangents)
}

function buildPositionAnim(kfs, duration_ms, tangents) {
  const hasTranslate = kfs.some((k) => k.translateX !== undefined || k.translateY !== undefined)
  if (!hasTranslate) return staticPositionCenter()
  let lastX = 0
  let lastY = 0
  const points = kfs.map((k) => {
    if (k.translateX !== undefined) lastX = k.translateX
    if (k.translateY !== undefined) lastY = k.translateY
    return {
      t: toFrames(k.t, duration_ms),
      s: [COMP_CENTER[0] + lastX, COMP_CENTER[1] + lastY, 0],
    }
  })
  return wrapKeyframes(points, tangents)
}

function buildRotationAnim(kfs, duration_ms, tangents) {
  const hasRotate = kfs.some((k) => k.rotate !== undefined)
  if (!hasRotate) return staticRotation0()
  let last = 0
  const points = kfs.map((k) => {
    const v = k.rotate !== undefined ? k.rotate : last
    last = v
    return { t: toFrames(k.t, duration_ms), s: [v] }
  })
  return wrapKeyframes(points, tangents)
}

function buildFillColorAnim(kfs, duration_ms, tangents) {
  const hasFill = kfs.some((k) => k.fill !== undefined)
  if (!hasFill) return { a: 0, k: hexToRgb01(PINK_HEX) }
  let last = PINK_HEX
  const points = kfs.map((k) => {
    const v = k.fill !== undefined ? k.fill : last
    last = v
    return { t: toFrames(k.t, duration_ms), s: hexToRgb01(v) }
  })
  return wrapKeyframes(points, tangents)
}

function wrapKeyframes(points, tangents) {
  if (points.length === 1) {
    return { a: 0, k: points[0].s.length === 1 ? points[0].s[0] : points[0].s }
  }
  const last = points.length - 1
  const k = points.map((p, i) => {
    if (i === last) return { t: p.t, s: p.s }
    return { ...tangents, t: p.t, s: p.s }
  })
  return { a: 1, k }
}

// ── Layer builders ──────────────────────────────────────────────────────────

function buildTransform(kfs, duration_ms, tangents) {
  return {
    o: buildOpacityAnim(kfs, duration_ms, tangents),
    r: buildRotationAnim(kfs, duration_ms, tangents),
    p: buildPositionAnim(kfs, duration_ms, tangents),
    a: staticAnchor0(),
    s: buildScaleAnim(kfs, duration_ms, tangents),
  }
}

function buildGroupTransform() {
  return {
    ty: 'tr',
    p: { a: 0, k: [0, 0], ix: 2 },
    a: { a: 0, k: [0, 0], ix: 1 },
    s: { a: 0, k: [100, 100], ix: 3 },
    r: { a: 0, k: 0, ix: 6 },
    o: { a: 0, k: 100, ix: 7 },
    sk: { a: 0, k: 0, ix: 4 },
    sa: { a: 0, k: 0, ix: 5 },
    nm: 'Transform',
  }
}

function buildShape({ kfs, duration_ms, tangents, diameter = CIRCLE_DIAMETER }) {
  return {
    ty: 'gr',
    it: [
      {
        ty: 'el',
        p: { a: 0, k: [0, 0], ix: 3 },
        s: { a: 0, k: [diameter, diameter], ix: 2 },
        nm: 'Ellipse Path',
        d: 1,
      },
      {
        ty: 'fl',
        c: buildFillColorAnim(kfs, duration_ms, tangents),
        o: { a: 0, k: 100, ix: 5 },
        r: 1,
        nm: 'Fill',
      },
      buildGroupTransform(),
    ],
    nm: 'Circle Group',
  }
}

function buildLayer({
  ind,
  name,
  kfs,
  duration_ms,
  tangents,
  position,
  scaleOverride,
  diameter,
  ip = 0,
  op,
}) {
  const transform = buildTransform(kfs, duration_ms, tangents)
  if (position) transform.p = { a: 0, k: position }
  if (scaleOverride) transform.s = { a: 0, k: scaleOverride }
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm: name,
    sr: 1,
    ks: transform,
    ao: 0,
    shapes: [buildShape({ kfs, duration_ms, tangents, diameter })],
    ip,
    op,
    st: 0,
    bm: 0,
  }
}

// ── Composition builder ─────────────────────────────────────────────────────

function buildComposition(demo) {
  const totalFrames = toFrames(1, demo.duration_ms)
  const tangents = easingFor(demo)
  const nameNote = demo.playerOverride?.label
    ? `circle (${demo.playerOverride.label} — anti-pattern)`
    : 'circle'

  const layers = []

  if (demo.id === 'sequence-list-stagger') {
    // 5 circles, vertically distributed, each delayed by stagger interval.
    const seq = demo.sequence
    const childDurationMs = 200
    const childOp = toFrames(1, childDurationMs)
    const ys = [290, 430, 570, 710, 850]
    for (let i = 0; i < seq.childCount; i++) {
      const startDelayMs = seq.delayChildren_ms + i * seq.staggerInterval_ms
      const ip = toFrames(1, startDelayMs)
      layers.push(
        buildLayer({
          ind: i + 1,
          name: `stagger-item-${i + 1}`,
          kfs: demo.keyframes,
          duration_ms: childDurationMs,
          tangents,
          position: [COMP_CENTER[0], ys[i] ?? COMP_CENTER[1], 0],
          diameter: 140,
          ip,
          op: ip + childOp,
        })
      )
    }
    // Reverse layer order so first item paints on top (Lottie paints last layer first).
    layers.reverse().forEach((l, i) => (l.ind = i + 1))
    return wrapComp(demo, layers, totalFrames, nameNote)
  }

  if (demo.id === 'sequence-conclusion-hero' && demo.layers) {
    const [hero, title] = ['hero', 'title'].map((id) => demo.layers.find((l) => l.id === id))

    const heroLayer = buildLayer({
      ind: 1,
      name: 'hero',
      kfs: hero.keyframes,
      duration_ms: hero.duration_ms,
      tangents,
      ip: toFrames(1, hero.delay_ms),
      op: toFrames(1, hero.delay_ms + hero.duration_ms),
    })
    const titleStart = toFrames(1, title.delay_ms)
    const titleLayer = buildLayer({
      ind: 2,
      name: 'title',
      kfs: title.keyframes,
      duration_ms: title.duration_ms,
      tangents,
      position: [COMP_CENTER[0], COMP_CENTER[1] + 320, 0],
      scaleOverride: [40, 8, 100],
      ip: titleStart,
      op: titleStart + toFrames(1, title.duration_ms),
    })
    return wrapComp(demo, [titleLayer, heroLayer], totalFrames, nameNote)
  }

  layers.push(
    buildLayer({
      ind: 1,
      name: nameNote,
      kfs: demo.keyframes,
      duration_ms: demo.duration_ms,
      tangents,
      op: totalFrames,
    })
  )
  return wrapComp(demo, layers, totalFrames, nameNote)
}

function wrapComp(demo, layers, totalFrames, _nameNote) {
  return {
    v: '5.7.4',
    fr: COMP_FPS,
    ip: 0,
    op: totalFrames,
    w: COMP_WIDTH,
    h: COMP_HEIGHT,
    nm: demo.title,
    ddd: 0,
    assets: [],
    layers,
    markers: [],
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  const spec = JSON.parse(readFileSync(SRC, 'utf8'))
  mkdirSync(OUT_DIR, { recursive: true })

  const targets = onlyId ? spec.demos.filter((d) => d.id === onlyId) : spec.demos
  if (onlyId && targets.length === 0) {
    console.error(`[export-lottie] no demo with id "${onlyId}" — known ids:`)
    spec.demos.forEach((d) => console.error(`  - ${d.id}`))
    process.exit(1)
  }

  const summary = []
  for (const demo of targets) {
    const comp = buildComposition(demo)
    const outPath = join(OUT_DIR, `${demo.id}.json`)
    writeFileSync(outPath, JSON.stringify(comp, null, 2), 'utf8')
    const { size } = statSync(outPath)
    summary.push({ id: demo.id, path: outPath, bytes: size })
  }

  console.log(`[export-lottie] wrote ${summary.length} file(s) to ${OUT_DIR}`)
  for (const s of summary) {
    console.log(`  - ${s.id}.json (${s.bytes} bytes)`)
  }
}

main()
