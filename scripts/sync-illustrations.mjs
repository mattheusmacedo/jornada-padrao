// Copies hand-authored Lottie illustration JSONs from the source folder into
// the Vite app's public/illustrations/ so screens can fetch them at runtime.
// Each entry has a source path (relative to 2_SOURCE/footages/JSON) and a
// destination filename (so we can normalize names like conclusao6 → conclusao).

import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SRC_ROOT = resolve(__dirname, '../../2_SOURCE/footages/JSON')
const DEST_DIR = resolve(__dirname, '../public/illustrations')

const ENTRIES = [
  { src: 'v1/ramificacao.json', dest: 'ramificacao.json' },
  { src: 'v1/ramificacao3.json', dest: 'ramificacao3.json' },
  { src: 'conclusao6.json', dest: 'conclusao.json' },
]

mkdirSync(DEST_DIR, { recursive: true })

let copied = 0
let skipped = 0
for (const { src, dest } of ENTRIES) {
  const srcPath = resolve(SRC_ROOT, src)
  const destPath = resolve(DEST_DIR, dest)
  if (!existsSync(srcPath)) {
    console.warn(`[sync-illustrations] WARN: ${srcPath} not found — skipping`)
    skipped++
    continue
  }
  copyFileSync(srcPath, destPath)
  console.log(`[sync-illustrations] copied ${src} → ${dest}`)
  copied++
}

console.log(`[sync-illustrations] ${copied} copied, ${skipped} skipped`)
