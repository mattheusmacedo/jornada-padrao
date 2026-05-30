// Encodes ProRes 4444 .mov sources with alpha into:
// - WebM VP9 alpha for Chromium / Firefox / Edge.
// - animated WebP alpha for Safari / iOS fallback rendering.
//
// Path 2 (parked): HEVC MP4 alpha for older Safari requires Apple's
// hevc_videotoolbox encoder (macOS-only). When that's available, run:
//   ffmpeg -i input.mov -c:v hevc_videotoolbox -alpha_quality 0.75 \
//     -pix_fmt yuva420p -tag:v hvc1 -b:v 1M output.mp4
// and drop the .mp4 siblings into the same VIDEO/ folder. The sync script
// already copies *.mp4 alongside *.webm and *.webp.
//
// Source:  D:/05_MotionDesignParaProdutoDigital/2_SOURCE/footages/renders/StateMachine_v2/POS/*.mov
// Output:  D:/05_MotionDesignParaProdutoDigital/2_SOURCE/footages/VIDEO/{name}.webm
//          D:/05_MotionDesignParaProdutoDigital/2_SOURCE/footages/VIDEO/{name}.webp
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

const SRC_DIR = resolve(__dirname, '../../2_SOURCE/footages/renders/StateMachine_v2/POS')
const OUT_DIR = resolve(__dirname, '../../2_SOURCE/footages/VIDEO')

// Source MOV -> output basename.
const STATES = [
  { src: 'idle_pos.mov', out: 'idle' },
  { src: 'Ramification_Phone_pos.mov', out: 'idle-phone' },
  { src: 'Ramification_Phone 2_pos.mov', out: 'idle-phone-2' },
  { src: 'Ramification_Band_pos.mov', out: 'idle-bands' },
  { src: 'Conclusion_Dance_pos.mov', out: 'conclusao-dance' },
  { src: 'Conclusion_Character_Cowgirl_pos.mov', out: 'conclusao-character-cowgirl' },
  { src: 'Conclusion_Character_Glam_pos.mov', out: 'conclusao-character-glam' },
  { src: 'Conclusion_Character_Pop_pos.mov', out: 'conclusao-character-pop' },
  { src: 'Conclusion_Character_Raver_pos.mov', out: 'conclusao-character-raver' },
]

const VIDEO_CRF = process.env.VIDEO_CRF || '18'
const TARGET_FPS = process.env.VIDEO_FPS || '60'
const WEBP_Q = process.env.WEBP_Q || '74'
const WEBP_FPS = process.env.WEBP_FPS || TARGET_FPS

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

function encodeWebm(srcPath, out) {
  const webmOut = resolve(OUT_DIR, `${out}.webm`)
  const filterComplex =
    `[0:v]format=rgba,split=2[color][alpha];` +
    `[color]format=rgb24,fps=fps=${TARGET_FPS}[color60];` +
    `[alpha]alphaextract,fps=fps=${TARGET_FPS}[alpha60];` +
    `[color60][alpha60]alphamerge,format=yuva420p[v]`

  const time = runFfmpeg(`${out}.webm`, [
    '-y',
    '-i', srcPath,
    '-filter_complex', filterComplex,
    '-map', '[v]',
    '-c:v', 'libvpx-vp9',
    '-crf', VIDEO_CRF,
    '-b:v', '0',
    '-auto-alt-ref', '0',
    '-deadline', 'good',
    '-cpu-used', '2',
    '-row-mt', '1',
    '-an',
    webmOut,
  ])

  return { path: webmOut, size: statSync(webmOut).size, time }
}

function encodeWebp(srcPath, out) {
  const webpOut = resolve(OUT_DIR, `${out}.webp`)
  const time = runFfmpeg(`${out}.webp`, [
    '-y',
    '-i', srcPath,
    '-vf', `fps=fps=${WEBP_FPS},scale=iw:ih:flags=lanczos,format=yuva420p`,
    '-c:v', 'libwebp_anim',
    '-lossless', '0',
    '-q:v', WEBP_Q,
    '-compression_level', '5',
    '-loop', '0',
    '-an',
    webpOut,
  ])

  return { path: webpOut, size: statSync(webpOut).size, time }
}

function encodeState({ src, out }) {
  const srcPath = resolve(SRC_DIR, src)
  if (!existsSync(srcPath)) {
    console.warn(`[encode-state-videos] WARN: source missing, skipping: ${srcPath}`)
    return null
  }

  const srcSize = statSync(srcPath).size
  const webm = encodeWebm(srcPath, out)
  const webp = encodeWebp(srcPath, out)

  return { out, srcPath, srcSize, webm, webp }
}

const targets = onlyName ? STATES.filter((s) => s.out === onlyName) : STATES
if (onlyName && targets.length === 0) {
  console.error(`[encode-state-videos] no state named "${onlyName}". Known:`)
  STATES.forEach((s) => console.error(`  - ${s.out}`))
  process.exit(1)
}

const results = []
for (const state of targets) {
  console.log(`[encode-state-videos] encoding ${state.out} from ${state.src}...`)
  const result = encodeState(state)
  if (result) results.push(result)
}

console.log('\n[encode-state-videos] summary')
console.log('state                source (MOV)   ->   WebM 60fps alpha      WebP 60fps Safari alpha')
let totalSrc = 0
let totalWebm = 0
let totalWebp = 0

for (const result of results) {
  const ratio = (result.srcSize / result.webm.size).toFixed(1)
  console.log(
    `${result.out.padEnd(20)} ${fmtBytes(result.srcSize).padEnd(11)}     ` +
    `${fmtBytes(result.webm.size).padEnd(10)} (${result.webm.time}s, ${ratio}x smaller)     ` +
    `${fmtBytes(result.webp.size).padEnd(10)} (${result.webp.time}s)`
  )
  totalSrc += result.srcSize
  totalWebm += result.webm.size
  totalWebp += result.webp.size
}

console.log(`${'TOTAL'.padEnd(20)} ${fmtBytes(totalSrc).padEnd(11)}     ${fmtBytes(totalWebm).padEnd(10)}     ${fmtBytes(totalWebp)}`)
console.log(`\nWebM payload (combined): ${fmtBytes(totalWebm)}`)
console.log(`WebP payload (combined): ${fmtBytes(totalWebp)}`)
