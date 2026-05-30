// Batch FBX → GLB converter for music-burst icon models.
//
// Pipeline per file:
//   1. FBX2glTF (binary in scripts/bin/) → raw .glb
//   2. gltf-transform optimize with Meshopt + 0.75 simplify
//   3. Final .glb written next to the .fbx, same basename
//
// Run with: node scripts/convert-fbx-to-glb.mjs
//
// FBX files are left in place so the change can be rolled back by reverting
// the loader code + path swap. Delete .fbx in a follow-up commit once the
// pipeline is verified.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, statSync } from 'node:fs'
import { glob } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname, basename, extname, resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..')
const fbx2gltf = join(projectRoot, 'scripts', 'bin', 'FBX2glTF.exe')
const modelsRoot = join(projectRoot, 'public', 'models')

const SIMPLIFY_RATIO = '0.75'

function logSize(label, p) {
  const bytes = statSync(p).size
  const kb = (bytes / 1024).toFixed(0)
  const mb = (bytes / 1024 / 1024).toFixed(2)
  console.log(`  ${label.padEnd(10)} ${bytes >= 1024 * 1024 ? `${mb} MB` : `${kb} KB`}`)
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
  const finalGlb = join(outDir, `${name}.glb`)

  const tempDir = mkdtempSync(join(tmpdir(), 'fbx2glb-'))
  const rawGlb = join(tempDir, `${name}.glb`)

  console.log(`\n→ ${fbxPath.slice(projectRoot.length + 1)}`)
  logSize('FBX', fbxPath)

  // 1. FBX → raw GLB
  execFileSync(fbx2gltf, ['-b', '-i', fbxPath, '-o', join(tempDir, name)], { stdio: ['ignore', 'ignore', 'inherit'] })
  logSize('GLB raw', rawGlb)

  // 2. gltf-transform optimize (Meshopt + simplify)
  execFileSync('npx', [
    'gltf-transform',
    'optimize',
    rawGlb,
    finalGlb,
    '--simplify', 'true',
    '--simplify-ratio', SIMPLIFY_RATIO,
    '--texture-compress', 'webp',
    '--compress', 'meshopt',
  ], { stdio: ['ignore', 'ignore', 'inherit'], shell: true })
  logSize('GLB final', finalGlb)

  rmSync(tempDir, { recursive: true, force: true })

  return { fbx: statSync(fbxPath).size, glb: statSync(finalGlb).size }
}

const files = await findFbxFiles()
if (files.length === 0) {
  console.error('No .fbx files found under public/models')
  process.exit(1)
}

console.log(`Converting ${files.length} FBX file(s)...`)

let totalFbx = 0
let totalGlb = 0
for (const f of files) {
  const { fbx, glb } = convertOne(f)
  totalFbx += fbx
  totalGlb += glb
}

const fmt = (b) => `${(b / 1024 / 1024).toFixed(2)} MB`
console.log(`\nTotal: ${fmt(totalFbx)} → ${fmt(totalGlb)} (${((1 - totalGlb / totalFbx) * 100).toFixed(0)}% reduction)`)
console.log(`\nNext: update musicBurstConfig.ts paths from .fbx to .glb,`)
console.log(`      swap FBXLoader → GLTFLoader + MeshoptDecoder in MusicNotesOverlay.tsx and MusicModelPreview.tsx,`)
console.log(`      verify in dev, then remove the .fbx files.`)
