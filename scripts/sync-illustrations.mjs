// Copies hand-authored assets from 2_SOURCE into the Vite app's public/ folder
// so screens can fetch them at runtime. Two asset families:
//
//   Lottie JSONs → public/illustrations/
//   Alpha videos → public/videos/state-machine/
//
// On Vercel (where 2_SOURCE does not exist), this script no-ops: it logs
// "skipped" for every entry whose source file is missing, then exits 0 so
// the build continues using the already-committed public/ files.

import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SRC_ROOT = resolve(__dirname, '../../2_SOURCE/footages')

const ILLUSTRATIONS_DEST = resolve(__dirname, '../public/illustrations')
const VIDEOS_DEST = resolve(__dirname, '../public/videos/state-machine')

// Lottie illustrations (small vector files only — bloated raster Lotties are
// gone now that the character animation is served as alpha video).
const ILLUSTRATIONS = [
  // (intentionally none right now — the small ramificacao.json was the only
  // candidate, and even that is no longer referenced after Phase F. Add entries
  // here as new vector Lotties land.)
]

// Alpha-video state machine clips. WebM VP9 with alpha for now; MP4 HEVC alpha
// can be dropped into the same VIDEO/ folder later (Path 2, requires macOS
// encoding) and this script will pick them up automatically.
const VIDEO_NAMES = [
  'idle',
  'idle-phone',
  'idle-phone-2',
  'idle-bands',
  'conclusao-dance',
  'conclusao-character-cowgirl',
  'conclusao-character-glam',
  'conclusao-character-pop',
  'conclusao-character-raver',
]
const VIDEO_EXTS = ['.webm', '.mp4']

mkdirSync(ILLUSTRATIONS_DEST, { recursive: true })
mkdirSync(VIDEOS_DEST, { recursive: true })

let copied = 0
let skipped = 0

function copyOne(srcPath, destPath, label) {
  if (!existsSync(srcPath)) {
    console.warn(`[sync-illustrations] WARN: ${label} not found at ${srcPath} — skipping`)
    skipped++
    return
  }
  copyFileSync(srcPath, destPath)
  console.log(`[sync-illustrations] copied ${label}`)
  copied++
}

for (const { src, dest } of ILLUSTRATIONS) {
  copyOne(resolve(SRC_ROOT, 'JSON', src), resolve(ILLUSTRATIONS_DEST, dest), src)
}

for (const name of VIDEO_NAMES) {
  for (const ext of VIDEO_EXTS) {
    const file = `${name}${ext}`
    copyOne(resolve(SRC_ROOT, 'VIDEO', file), resolve(VIDEOS_DEST, file), file)
  }
}

console.log(`[sync-illustrations] ${copied} copied, ${skipped} skipped`)
