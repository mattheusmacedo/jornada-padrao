// Batch FBX → GLB converter for music-burst icon models.
//
// Pipeline per file:
//   1. FBX2glTF (binary in scripts/bin/) → raw .glb, with optional per-model
//      UV flip flags (--flip-u / --flip-v) for files whose textures came out
//      mirrored in v1.
//   2. gltf-transform optimize with Meshopt, NO simplify (lossless geometry).
//   3. Final .glb written next to the .fbx as BOTH:
//        - {name}.glb          ← canonical latest (what the app loads)
//        - {name}.v{N}.glb     ← versioned snapshot for the sandbox toggle
//
// Run with:
//   node scripts/convert-fbx-to-glb.mjs            # uses next auto version
//   node scripts/convert-fbx-to-glb.mjs --version 3
//
// Per-model UV flip overrides go in FLIP_OVERRIDES below. Use the model id
// from musicBurstConfig.ts. Run after v1 is in the sandbox so you know which
// models actually need flipping.

import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, readdirSync, rmSync, statSync, existsSync } from 'node:fs'
import { glob } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname, basename, extname, resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..')
const fbx2gltf = join(projectRoot, 'scripts', 'bin', 'FBX2glTF.exe')
const modelsRoot = join(projectRoot, 'public', 'models')

// Per-model FBX2glTF flip overrides. Keyed by basename without extension
// (matches the .fbx filename, e.g. "loudspeaker", "accordion-icon").
//   true  → pass --flip-u / --flip-v
//   false → pass --no-flip-u / --no-flip-v (overrides FBX2glTF's default)
//   undefined → leave FBX2glTF's default behaviour untouched
//
// Populate as you find broken models in /model-sandbox.
// v3: suppress FBX2glTF's default V flip on every model. Verified on
// musical-note in v2 — without --no-flip-v, the V axis gets double-
// flipped (once by FBX2glTF, once by GLTFLoader) and textures land
// upside-down on the mesh.
const FLIP_OVERRIDES = Object.fromEntries(
  [
    'accordion-icon',
    'bj-mixer-icon',
    'clarinet-icon',
    'conga-icon',
    'drum-icon',
    'electric-guitar-icon',
    'guitar-icon',
    'headphones-icon',
    'loudspeaker',
    'microphone-icon',
    'musical-note-icon',
    'trumpet-icon',
  ].map((name) => [name, { flipV: false }]),
)

const versionArg = process.argv.indexOf('--version')
const requestedVersion = versionArg >= 0 ? Number(process.argv[versionArg + 1]) : null

const onlyArg = process.argv.indexOf('--only')
const onlyFilter = onlyArg >= 0
  ? new Set(process.argv[onlyArg + 1].split(',').map((s) => s.trim()))
  : null

function nextVersionFor(dir, name) {
  if (requestedVersion) return requestedVersion
  const entries = readdirSync(dir)
  const re = new RegExp(`^${name}\\.v(\\d+)\\.glb$`)
  let max = 0
  for (const e of entries) {
    const m = e.match(re)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return max + 1
}

function logSize(label, p) {
  const bytes = statSync(p).size
  const kb = (bytes / 1024).toFixed(0)
  const mb = (bytes / 1024 / 1024).toFixed(2)
  console.log(`  ${label.padEnd(14)} ${bytes >= 1024 * 1024 ? `${mb} MB` : `${kb} KB`}`)
}

async function findFbxFiles() {
  const out = []
  for await (const p of glob('public/models/**/*.fbx', { cwd: projectRoot })) {
    out.push(join(projectRoot, p))
  }
  return out
}

function convertOne(fbxPath) {
  const name = basename(fbxPath, extname(fbxPath))
  const outDir = dirname(fbxPath)
  const canonicalGlb = join(outDir, `${name}.glb`)
  const version = nextVersionFor(outDir, name)
  const versionedGlb = join(outDir, `${name}.v${version}.glb`)
  const flip = FLIP_OVERRIDES[name] ?? {}

  const tempDir = mkdtempSync(join(tmpdir(), 'fbx2glb-'))
  const rawGlb = join(tempDir, `${name}.glb`)

  const flipLabel = [
    flip.flipU === true ? '+u' : flip.flipU === false ? '-u' : '',
    flip.flipV === true ? '+v' : flip.flipV === false ? '-v' : '',
  ].filter(Boolean).join('')
  console.log(`\n→ ${fbxPath.slice(projectRoot.length + 1)}  (v${version}${flipLabel ? `, flip ${flipLabel}` : ''})`)
  logSize('FBX', fbxPath)

  // 1. FBX → raw GLB (with optional UV flips)
  const fbxArgs = ['-b', '-i', fbxPath, '-o', join(tempDir, name)]
  if (flip.flipU === true) fbxArgs.push('--flip-u')
  if (flip.flipU === false) fbxArgs.push('--no-flip-u')
  if (flip.flipV === true) fbxArgs.push('--flip-v')
  if (flip.flipV === false) fbxArgs.push('--no-flip-v')
  execFileSync(fbx2gltf, fbxArgs, { stdio: ['ignore', 'ignore', 'inherit'] })

  // 2. gltf-transform optimize (Meshopt only, no simplify)
  execFileSync('npx', [
    'gltf-transform',
    'optimize',
    rawGlb,
    versionedGlb,
    '--simplify', 'false',
    '--texture-compress', 'webp',
    '--compress', 'meshopt',
  ], { stdio: ['ignore', 'ignore', 'inherit'], shell: true })
  logSize(`GLB v${version}`, versionedGlb)

  // 3. Copy versioned → canonical so the app always loads the latest
  copyFileSync(versionedGlb, canonicalGlb)

  rmSync(tempDir, { recursive: true, force: true })

  return { fbx: statSync(fbxPath).size, glb: statSync(versionedGlb).size, version }
}

const allFiles = await findFbxFiles()
if (allFiles.length === 0) {
  console.error('No .fbx files found under public/models')
  process.exit(1)
}

const files = onlyFilter
  ? allFiles.filter((f) => onlyFilter.has(basename(f, extname(f))))
  : allFiles

if (onlyFilter && files.length === 0) {
  console.error(`--only matched no files. Filter: ${[...onlyFilter].join(', ')}`)
  process.exit(1)
}

const overrideKeys = Object.keys(FLIP_OVERRIDES)
console.log(`Converting ${files.length}/${allFiles.length} FBX file(s)${overrideKeys.length ? ` — flip overrides on: ${overrideKeys.join(', ')}` : ''}...`)

let totalFbx = 0
let totalGlb = 0
const versionsSeen = new Set()
for (const f of files) {
  const { fbx, glb, version } = convertOne(f)
  totalFbx += fbx
  totalGlb += glb
  versionsSeen.add(version)
}

// When using --only, copy the previous version of skipped models forward
// so the new version has a complete set of files and the sandbox v{N}
// button can load every model without 404s.
if (onlyFilter && versionsSeen.size === 1) {
  const v = [...versionsSeen][0]
  const skipped = allFiles.filter((f) => !files.includes(f))
  for (const fbxPath of skipped) {
    const name = basename(fbxPath, extname(fbxPath))
    const dir = dirname(fbxPath)
    const prev = join(dir, `${name}.v${v - 1}.glb`)
    const next = join(dir, `${name}.v${v}.glb`)
    if (existsSync(prev) && !existsSync(next)) {
      copyFileSync(prev, next)
      console.log(`  ↳ carry-forward v${v - 1} → v${v}: ${name}`)
    }
  }
}

const fmt = (b) => `${(b / 1024 / 1024).toFixed(2)} MB`
const versionTag = versionsSeen.size === 1 ? `v${[...versionsSeen][0]}` : `versions ${[...versionsSeen].sort().map((v) => `v${v}`).join(', ')}`
console.log(`\nTotal (${versionTag}): ${fmt(totalFbx)} → ${fmt(totalGlb)} (${((1 - totalGlb / totalFbx) * 100).toFixed(0)}% reduction)`)
console.log(`\nUpdate src/components/modelVersions.ts to include ${versionTag} for the sandbox toggle.`)
