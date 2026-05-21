// Copies the motion-system.json source-of-truth spec into the Vite app's
// public/ folder so the /motion-docs route can fetch it at runtime.
// Run via `npm run sync:motion-spec` or automatically before `dev` and `build`.

import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SRC = resolve(
  __dirname,
  '../../2_SOURCE/footages/JSON/motion-system.json'
)
const DEST = resolve(__dirname, '../public/motion-system.json')

if (!existsSync(SRC)) {
  console.warn(`[sync-motion-spec] WARN: source not found at ${SRC} — skipping copy.`)
  process.exit(0)
}

mkdirSync(dirname(DEST), { recursive: true })
copyFileSync(SRC, DEST)
console.log(`[sync-motion-spec] copied ${SRC} → ${DEST}`)
