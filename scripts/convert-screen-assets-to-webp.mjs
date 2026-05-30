// Convert event/avatar/hero PNGs under src/assets/ to WebP, downsizing
// any source wider than the phone-frame retina target.
//
// Phone frame is 390-440 px wide. At 2x retina that's ~880 px max for
// fullbleed cards. We cap at 800 px width — plenty for the largest
// rendered context (fullbleed Explorar card, Evento hero) and overkill
// for compact card thumbnails / avatars.
//
// Quality q=85 lossy WebP. PNGs left in place; swap is done by changing
// the import path in screen files. Run with:
//   node scripts/convert-screen-assets-to-webp.mjs

import { statSync } from 'node:fs'
import { glob } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import sharp from 'sharp'

const projectRoot = resolve(import.meta.dirname, '..')
const MAX_WIDTH = 800
const QUALITY = 85

async function findPngs() {
  const out = []
  for await (const p of glob('src/assets/**/*.png', { cwd: projectRoot })) {
    out.push(join(projectRoot, p))
  }
  return out
}

const fmt = (b) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(2)} MB` : `${(b / 1024).toFixed(0)} KB`)

const files = await findPngs()
if (files.length === 0) {
  console.error('No PNGs found under src/assets/')
  process.exit(1)
}

console.log(`Converting ${files.length} screen asset(s)... (max width ${MAX_WIDTH}px, WebP q=${QUALITY})`)

let totalPng = 0
let totalWebp = 0
const rows = []

for (const pngPath of files) {
  const webpPath = pngPath.replace(/\.png$/i, '.webp')
  const meta = await sharp(pngPath).metadata()
  const needsResize = (meta.width ?? 0) > MAX_WIDTH

  let pipeline = sharp(pngPath)
  if (needsResize) pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true })
  await pipeline.webp({ quality: QUALITY, effort: 6 }).toFile(webpPath)

  const pngBytes = statSync(pngPath).size
  const webpBytes = statSync(webpPath).size
  totalPng += pngBytes
  totalWebp += webpBytes
  rows.push({
    name: pngPath.split(/[\\/]/).slice(-2).join('/'),
    before: `${meta.width}x${meta.height}`,
    after: needsResize ? `${MAX_WIDTH}x${Math.round((MAX_WIDTH / (meta.width ?? 1)) * (meta.height ?? 1))}` : `${meta.width}x${meta.height}`,
    pngBytes,
    webpBytes,
  })
}

rows.sort((a, b) => b.pngBytes - a.pngBytes)
console.log('\nname'.padEnd(40), 'dim before'.padEnd(14), 'dim after'.padEnd(14), 'png'.padStart(10), '→', 'webp'.padStart(8), 'savings')
for (const r of rows) {
  const pct = ((1 - r.webpBytes / r.pngBytes) * 100).toFixed(0)
  console.log(
    r.name.padEnd(40),
    r.before.padEnd(14),
    r.after.padEnd(14),
    fmt(r.pngBytes).padStart(10),
    '→',
    fmt(r.webpBytes).padStart(8),
    `-${pct}%`,
  )
}

const pct = ((1 - totalWebp / totalPng) * 100).toFixed(0)
console.log(`\nTotal: ${fmt(totalPng)} → ${fmt(totalWebp)} (-${pct}%) across ${files.length} files`)
console.log(`\nNext: swap .png → .webp imports in screen files, verify visually, then delete the PNGs.`)
