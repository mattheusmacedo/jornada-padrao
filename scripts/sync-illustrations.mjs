// Copies hand-authored Lottie illustration JSONs from the v1 source folder
// into the Vite app's public/illustrations/ so screens can fetch them at runtime.
// Add new entries to the manifest as illustrations land.

import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SRC_DIR = resolve(__dirname, '../../2_SOURCE/footages/JSON/v1')
const DEST_DIR = resolve(__dirname, '../public/illustrations')

const FILES = ['ramificacao.json']

mkdirSync(DEST_DIR, { recursive: true })

let copied = 0
let skipped = 0
for (const name of FILES) {
  const src = resolve(SRC_DIR, name)
  const dest = resolve(DEST_DIR, name)
  if (!existsSync(src)) {
    console.warn(`[sync-illustrations] WARN: ${src} not found — skipping`)
    skipped++
    continue
  }
  copyFileSync(src, dest)
  console.log(`[sync-illustrations] copied ${name}`)
  copied++
}

console.log(`[sync-illustrations] ${copied} copied, ${skipped} skipped`)
