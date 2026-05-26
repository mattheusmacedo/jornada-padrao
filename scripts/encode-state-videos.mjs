// Encodes ProRes 4444 .mov sources (with alpha) into web-friendly WebM VP9
// with alpha (yuva420p) — works in Chrome / Firefox / Edge / Safari 18+.
//
// Path 2 (parked): HEVC MP4 alpha for older Safari requires Apple's
// hevc_videotoolbox encoder (macOS-only). When that's available, run:
//   ffmpeg -i input.mov -c:v hevc_videotoolbox -alpha_quality 0.75 \
//     -pix_fmt yuva420p -tag:v hvc1 -b:v 1M output.mp4
// …and drop the .mp4 siblings into the same VIDEO/ folder. The sync script
// already copies *.mp4 alongside *.webm; AlphaVideo's <source> chain needs
// one line uncommented to pick them up.
//
// Source:  D:/05_MotionDesignParaProdutoDigital/2_SOURCE/footages/png/State_Machine/*.mov
// Output:  D:/05_MotionDesignParaProdutoDigital/2_SOURCE/footages/VIDEO/{name}.webm
//
// Usage:
//   node scripts/encode-state-videos.mjs              # encode all states
//   node scripts/encode-state-videos.mjs --only idle  # encode one output
//   FFMPEG_BIN=/path/to/ffmpeg npm run encode:states  # override binary path

import { existsSync, mkdirSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const FFMPEG_BIN =
  process.env.FFMPEG_BIN ||
  'C:/Users/maced/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.1-full_build/bin/ffmpeg.exe'

const SRC_DIR = resolve(__dirname, '../../2_SOURCE/footages/png/State_Machine')
const OUT_DIR = resolve(__dirname, '../../2_SOURCE/footages/VIDEO')

// Source MOV → output basename (distinct paths even when the source clip is shared)
const STATES = [
  { src: 'Ramification_Idle.mov',  out: 'idle' },
  { src: 'Ramification_Phone.mov', out: 'idle-phone' },
  { src: 'Ramification_Band.mov',  out: 'idle-bands' },
  { src: 'Conclusion_Idle.mov',    out: 'conclusao-idle' },
  { src: 'Conclusion_Dance.mov',   out: 'conclusao-dance' },
]

const VIDEO_BITRATE = process.env.VIDEO_BITRATE || '1M'

const args = process.argv.slice(2)
const onlyIdx = args.indexOf('--only')
const onlyName = onlyIdx !== -1 ? args[onlyIdx + 1] : null

if (!existsSync(FFMPEG_BIN)) {
  console.error(`[encode-state-videos] ffmpeg not found at: ${FFMPEG_BIN}`)
  console.error('  set FFMPEG_BIN env var to point at your ffmpeg binary.')
  process.exit(1)
}

if (!existsSync(SRC_DIR)) {
  console.error(`[encode-state-videos] source folder missing: ${SRC_DIR}`)
  process.exit(1)
}

mkdirSync(OUT_DIR, { recursive: true })

function fmtBytes(n) {
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(2) + ' MB'
}

function runFfmpeg(label, ffmpegArgs) {
  const t0 = Date.now()
  const res = spawnSync(FFMPEG_BIN, ffmpegArgs, { stdio: ['ignore', 'pipe', 'pipe'] })
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
  if (res.status !== 0) {
    console.error(`[${label}] FAILED (exit ${res.status})`)
    console.error(res.stderr?.toString() ?? '<no stderr>')
    throw new Error(`ffmpeg failed: ${label}`)
  }
  return elapsed
}

function encodeState({ src, out }) {
  const srcPath = resolve(SRC_DIR, src)
  if (!existsSync(srcPath)) {
    console.warn(`[encode-state-videos] WARN: source missing, skipping: ${srcPath}`)
    return null
  }
  const srcSize = statSync(srcPath).size

  // WebM VP9 with alpha
  const webmOut = resolve(OUT_DIR, `${out}.webm`)
  const webmTime = runFfmpeg(`${out}.webm`, [
    '-y',
    '-i', srcPath,
    '-c:v', 'libvpx-vp9',
    '-pix_fmt', 'yuva420p',
    '-b:v', VIDEO_BITRATE,
    '-auto-alt-ref', '0',
    '-an',
    webmOut,
  ])
  const webmSize = statSync(webmOut).size

  return { out, srcPath, srcSize, webmSize, webmTime }
}

const targets = onlyName ? STATES.filter((s) => s.out === onlyName) : STATES
if (onlyName && targets.length === 0) {
  console.error(`[encode-state-videos] no state named "${onlyName}". Known:`)
  STATES.forEach((s) => console.error(`  - ${s.out}`))
  process.exit(1)
}

const results = []
for (const state of targets) {
  console.log(`[encode-state-videos] encoding ${state.out} from ${state.src}…`)
  const r = encodeState(state)
  if (r) results.push(r)
}

console.log('\n[encode-state-videos] summary')
console.log('state                source (MOV)   →   WebM (VP9 + alpha)')
let totalSrc = 0, totalWebm = 0
for (const r of results) {
  const ratio = (r.srcSize / r.webmSize).toFixed(1)
  console.log(
    `${r.out.padEnd(20)} ${fmtBytes(r.srcSize).padEnd(11)}     ` +
    `${fmtBytes(r.webmSize).padEnd(10)} (${r.webmTime}s, ${ratio}× smaller)`
  )
  totalSrc += r.srcSize
  totalWebm += r.webmSize
}
console.log(`${'TOTAL'.padEnd(20)} ${fmtBytes(totalSrc).padEnd(11)}     ${fmtBytes(totalWebm)}`)
console.log(`\nWebM payload (combined): ${fmtBytes(totalWebm)}`)
