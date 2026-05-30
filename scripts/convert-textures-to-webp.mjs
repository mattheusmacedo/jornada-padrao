// Convert all model texture PNGs under public/models/**/textures/ to WebP.
//
// Strategy by texture type:
//   - color / emissive maps  → lossy WebP q=85 (perceptual maps tolerate it)
//   - everything else (normal/AO/roughness/metalness/height/alpha)
//                            → lossless WebP (precision matters)
//
// PNGs are LEFT IN PLACE so the change can be rolled back by reverting
// the path swap in musicBurstConfig.ts. Delete .png in a follow-up commit
// once the swap is verified in /model-sandbox.
//
// Run with: node scripts/convert-textures-to-webp.mjs

import { readdirSync, statSync } from 'node:fs'
import { glob } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import sharp from 'sharp'

const projectRoot = resolve(import.meta.dirname, '..')

// Match texture role from filename suffix. Used to pick lossy vs lossless.
function isPerceptualMap(filename) {
  const lower = filename.toLowerCase()
  // col = color/diffuse; emissive contains the same kind of perceptual data.
  return /-col(-|\.)/.test(lower) || /-emissive(-|\.)/.test(lower) || /-col-brand-preview/.test(lower)
}

async function findPngs() {
  const out = []
  for await (const p of glob('public/models/**/textures/*.png', { cwd: projectRoot })) {
    out.push(join(projectRoot, p))
  }
  return out
}

function fmt(b) {
  return b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(2)} MB` : `${(b / 1024).toFixed(0)} KB`
}

const files = await findPngs()
if (files.length === 0) {
  console.error('No PNG textures found under public/models/**/textures/')
  process.exit(1)
}

console.log(`Converting ${files.length} texture(s)...`)

let totalPng = 0
let totalWebp = 0
const samples = []

for (const pngPath of files) {
  const webpPath = pngPath.replace(/\.png$/i, '.webp')
  const filename = pngPath.split(/[\\/]/).pop()
  const lossy = isPerceptualMap(filename)

  const pipeline = sharp(pngPath).webp(
    lossy
      ? { quality: 85, effort: 6 }
      : { lossless: true, effort: 6 },
  )

  await pipeline.toFile(webpPath)

  const pngBytes = statSync(pngPath).size
  const webpBytes = statSync(webpPath).size
  totalPng += pngBytes
  totalWebp += webpBytes

  if (samples.length < 4) {
    samples.push({ filename, lossy, pngBytes, webpBytes })
  }
}

console.log('\nSample (first 4):')
for (const { filename, lossy, pngBytes, webpBytes } of samples) {
  const pct = ((1 - webpBytes / pngBytes) * 100).toFixed(0)
  console.log(`  ${lossy ? 'lossy ' : 'lossless'}  ${filename.padEnd(70)} ${fmt(pngBytes).padStart(8)} → ${fmt(webpBytes).padStart(8)}  (-${pct}%)`)
}

const pct = ((1 - totalWebp / totalPng) * 100).toFixed(0)
console.log(`\nTotal: ${fmt(totalPng)} → ${fmt(totalWebp)} (-${pct}%) across ${files.length} files`)
console.log(`\nNext: swap .png → .webp in src/components/musicBurstConfig.ts and verify in /model-sandbox.`)
