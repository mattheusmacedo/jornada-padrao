// Visual inspector for the 12 music-burst 3D models. Loads each model in a
// large auto-rotating, click-and-drag-orbitable preview so you can confirm
// geometry, materials, and texture mapping at every stage of the
// optimization journey.
//
// Format selector at the top swaps every preview between:
//   - FBX prebrand  (original FBX + original PNG textures, pre-rebrand)
//   - FBX           (same geometry + post-rebrand PNG textures)
//   - GLB v1        (first lossless Meshopt conversion; UV V flipped wrong)
//   - GLB v2        (musical-note only — verified --no-flip-v fix on one model)
//   - GLB v3        (all 12 with --no-flip-v + WebP textures — current)
//
// Append new GLB versions to src/components/modelVersions.ts after each
// run of scripts/convert-fbx-to-glb.mjs.
//
// Route: /model-sandbox

import { useMemo, useState } from 'react'
import MusicModelPreview from '../components/MusicModelPreview'
import type { BurstTextureSpec } from '../components/MusicModelPreview'
import { MUSIC_BURST_MODEL_SPECS } from '../components/musicBurstConfig'
import { GLB_VERSIONS, type GlbVersion } from '../components/modelVersions'

type Format = 'fbx-prebrand' | 'fbx' | GlbVersion

const FORMAT_OPTIONS: { id: Format; label: string; description: string }[] = [
  { id: 'fbx-prebrand', label: 'FBX prebrand', description: 'True 4k source textures' },
  { id: 'fbx', label: 'FBX', description: 'Rebrand textures' },
  ...GLB_VERSIONS.map((v) => ({
    id: v,
    label: `GLB ${v}`,
    description:
      v === 'v3' ? 'Final + WebP textures' : v === 'v2' ? 'flip-v test (musical-note)' : 'Initial conversion',
  })),
]

// Approximate combined size (geometry + textures) per iteration. These
// numbers are documentation-grade snapshots — they don't need to be
// recomputed at runtime, and showing the journey is the point.
const ITERATION_SIZES: Record<Format, string> = {
  'fbx-prebrand': '212 MB',
  fbx: '13.6 MB',
  v1: '6.3 MB',
  v2: '6.3 MB',
  v3: '3.6 MB',
}

function geometryPathFor(modelPath: string, format: Format) {
  // modelPath is canonical /models/foo-fbx/foo.glb. Map to the requested
  // format/version. Prebrand FBX lives under /models-prebrand/.
  if (format === 'fbx-prebrand') {
    return modelPath.replace('/models/', '/models-prebrand/').replace(/\.glb$/i, '.fbx')
  }
  if (format === 'fbx') return modelPath.replace(/\.glb$/i, '.fbx')
  if (format === GLB_VERSIONS[GLB_VERSIONS.length - 1]) return modelPath
  return modelPath.replace(/\.glb$/i, `.${format}.glb`)
}

// Map BurstTextureSpec keys to the role suffix used in the original source
// filenames under /models-prebrand/<folder>/textures/<stem>-<role>-metalness-4k.png.
const PREBRAND_ROLE: Partial<Record<keyof BurstTextureSpec, string>> = {
  color: 'col',
  ao: 'ao',
  alpha: 'trans',
  height: 'height',
  normal: 'nrm',
  roughness: 'roughness',
  metalness: 'metalness',
  emissive: 'emissive',
}

function texturesFor(textures: BurstTextureSpec, format: Format): BurstTextureSpec {
  if (format !== 'fbx-prebrand') return textures
  // The truly original textures only use the default `-<role>-metalness-4k.png`
  // naming. Brand-preview color maps are post-original. Derive the stem
  // from the AO URL (which always uses the default name) and rebuild the
  // full spec from scratch, repointed under /models-prebrand/.
  const aoUrl = textures.ao ?? ''
  const match = aoUrl.match(/^\/models\/([^/]+)\/textures\/([^/]+)-ao-metalness-4k\.webp$/i)
  if (!match) return textures
  const [, folder, stem] = match
  const out: BurstTextureSpec = { color: '' }
  for (const key of Object.keys(textures) as (keyof BurstTextureSpec)[]) {
    if (textures[key] === undefined) continue
    const role = PREBRAND_ROLE[key]
    if (!role) continue
    out[key] = `/models-prebrand/${folder}/textures/${stem}-${role}-metalness-4k.png`
  }
  return out
}

export default function ModelSandbox() {
  const defaultVersion = GLB_VERSIONS[GLB_VERSIONS.length - 1]
  // In production builds the FBX prebrand / FBX / v1 / v2 assets aren't
  // shipped (gitignored), so the comparison tabs would 404. Show only
  // the canonical latest GLB version on Vercel; locally keep the full
  // optimization journey for documentation + handoff inspection.
  const isDev = import.meta.env.DEV
  const visibleOptions = isDev ? FORMAT_OPTIONS : FORMAT_OPTIONS.filter((o) => o.id === defaultVersion)
  const [format, setFormat] = useState<Format>(defaultVersion ?? 'fbx')

  const previewProps = useMemo(
    () =>
      Object.fromEntries(
        MUSIC_BURST_MODEL_SPECS.map((m) => [
          m.id,
          {
            pathOverride: geometryPathFor(m.path, format),
            texturesOverride: texturesFor(m.textures, format),
          },
        ]),
      ),
    [format],
  )

  return (
    <main className="min-h-screen bg-[#1c1c1c] px-6 py-8 text-white">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-5 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/55">Model Sandbox</p>
            <h1 className="mt-1 text-[28px] font-bold leading-tight">3D models — optimization journey</h1>
            <p className="mt-2 max-w-[680px] text-[13px] leading-relaxed text-white/70">
              All 12 music-burst models, every iteration. Drag to orbit the camera; release to resume auto-rotation.
              Pipeline identical to the production burst overlay, so anything wrong here is wrong in the real animation.
            </p>
          </div>
          <div className="shrink-0 text-right font-mono text-[12px] leading-relaxed">
            <p className="mb-1 font-sans text-[11px] uppercase tracking-[0.12em] text-white/50">Combined size per iteration</p>
            {(Object.entries(ITERATION_SIZES) as [Format, string][]).map(([id, size]) => {
              const label = FORMAT_OPTIONS.find((o) => o.id === id)?.label ?? id
              const isActive = id === format
              return (
                <p
                  key={id}
                  className="flex justify-between gap-6"
                  style={{ color: isActive ? '#ffffff' : 'rgba(255,255,255,0.55)' }}
                >
                  <span className="font-sans">{label}</span>
                  <span>{size}</span>
                </p>
              )
            })}
            <p className="mt-1 border-t border-white/15 pt-1 font-sans text-[11px] text-white/55">
              <span className="text-white">{ITERATION_SIZES['fbx-prebrand']}</span> → <span className="text-white">{ITERATION_SIZES.v3}</span>
              <span className="ml-1 text-[#9af48d]">(−98%)</span>
            </p>
          </div>
        </header>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="mr-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/55">Format:</span>
          {visibleOptions.map((option) => {
            const isActive = option.id === format
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setFormat(option.id)}
                className="rounded-[7px] border px-3 py-1.5 text-left transition-colors"
                style={{
                  borderColor: isActive ? '#E8176B' : 'rgba(255,255,255,0.22)',
                  background: isActive ? 'rgba(232,23,107,0.18)' : 'rgba(255,255,255,0.04)',
                }}
              >
                <span className="block text-[13px] font-bold leading-none">{option.label}</span>
                <span className="mt-0.5 block text-[11px] text-white/55">{option.description}</span>
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {MUSIC_BURST_MODEL_SPECS.map((model) => {
            const overrides = previewProps[model.id]
            return (
              <article
                key={model.id}
                className="overflow-hidden rounded-[10px] border border-white/15 bg-black/30"
              >
                <MusicModelPreview
                  // Force remount when format changes so the loader fully
                  // re-initializes for the new file extension + texture set.
                  key={`${model.id}-${format}`}
                  model={model}
                  pathOverride={overrides.pathOverride}
                  texturesOverride={overrides.texturesOverride}
                  autoRotate
                  rotateSpeed={0.85}
                  className="block aspect-square w-full"
                />
                <div className="border-t border-white/10 px-3 py-2">
                  <p className="text-[14px] font-bold leading-tight">{model.label}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-white/55">{model.id}</p>
                </div>
              </article>
            )
          })}
        </div>

        <p className="mt-6 text-[12px] text-white/45">
          Stages: <strong>FBX prebrand</strong> → texture rebrand → FBX2glTF conversion (v1 had wrong UV V) →
          per-model <code className="rounded bg-white/10 px-1 py-0.5">--no-flip-v</code> fix verified on musical-note (v2) →
          full batch with WebP texture compression (v3, current).
        </p>
      </div>
    </main>
  )
}
