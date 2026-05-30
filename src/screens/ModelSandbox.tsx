// Visual inspector for the 12 music-burst 3D models. Loads each model in a
// large auto-rotating preview so you can confirm geometry, materials, and
// texture mapping after the FBX→GLB conversion.
//
// Format selector at the top swaps every preview between:
//   - FBX     (the original source file — ground truth)
//   - GLB v1  (first lossless Meshopt conversion)
//   - GLB v2, v3, ... (subsequent iterations with flip/UV fixes)
//
// Append new versions to src/components/modelVersions.ts after each run
// of scripts/convert-fbx-to-glb.mjs.
//
// Route: /model-sandbox

import { useMemo, useState } from 'react'
import MusicModelPreview from '../components/MusicModelPreview'
import { MUSIC_BURST_MODEL_SPECS } from '../components/musicBurstConfig'
import { GLB_VERSIONS, type GlbVersion } from '../components/modelVersions'

type Format = 'fbx' | GlbVersion

const FORMAT_OPTIONS: { id: Format; label: string; description: string }[] = [
  { id: 'fbx', label: 'FBX', description: 'Original source' },
  ...GLB_VERSIONS.map((v) => ({
    id: v,
    label: `GLB ${v}`,
    description: 'Meshopt compressed',
  })),
]

function pathFor(modelPath: string, format: Format) {
  // modelPath is canonical .glb (e.g. /models/foo-fbx/foo.glb). Map to the
  // requested format/version. FBX lives next door with the same basename.
  if (format === 'fbx') return modelPath.replace(/\.glb$/i, '.fbx')
  return modelPath.replace(/\.glb$/i, `.${format}.glb`)
}

export default function ModelSandbox() {
  const [format, setFormat] = useState<Format>(GLB_VERSIONS[GLB_VERSIONS.length - 1] ?? 'fbx')

  const previewPaths = useMemo(
    () => Object.fromEntries(MUSIC_BURST_MODEL_SPECS.map((m) => [m.id, pathFor(m.path, format)])),
    [format],
  )

  return (
    <main className="min-h-screen bg-[#1c1c1c] px-6 py-8 text-white">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-5 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/55">Model Sandbox</p>
            <h1 className="mt-1 text-[28px] font-bold leading-tight">3D models — texture mapping check</h1>
            <p className="mt-2 max-w-[640px] text-[13px] leading-relaxed text-white/70">
              All 12 music-burst models spin on Y to expose every side. Use the format toggle to A/B compare the
              original FBX against each GLB iteration. Texture pipeline is identical to the production burst overlay,
              so anything wrong here is wrong in the real animation.
            </p>
          </div>
          <div className="shrink-0 text-right text-[12px] leading-snug text-white/60">
            <p>FBX total: <span className="font-mono text-white/80">9.19 MB</span></p>
            <p>GLB v1 total: <span className="font-mono text-white">1.93 MB</span> (−79%)</p>
          </div>
        </header>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="mr-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/55">Format:</span>
          {FORMAT_OPTIONS.map((option) => {
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
          {MUSIC_BURST_MODEL_SPECS.map((model) => (
            <article
              key={model.id}
              className="overflow-hidden rounded-[10px] border border-white/15 bg-black/30"
            >
              <MusicModelPreview
                // Force remount when format changes so the loader fully
                // re-initializes for the new file extension.
                key={`${model.id}-${format}`}
                model={model}
                pathOverride={previewPaths[model.id]}
                autoRotate
                rotateSpeed={0.85}
                className="block aspect-square w-full"
              />
              <div className="border-t border-white/10 px-3 py-2">
                <p className="text-[14px] font-bold leading-tight">{model.label}</p>
                <p className="mt-0.5 font-mono text-[11px] text-white/55">{model.id}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 text-[12px] text-white/45">
          Tell me which models look wrong on the current GLB version (mirrored, smeared UVs, missing detail, etc.).
          I&apos;ll populate <code className="rounded bg-white/10 px-1 py-0.5">FLIP_OVERRIDES</code> in
          <code className="rounded bg-white/10 px-1 py-0.5">scripts/convert-fbx-to-glb.mjs</code>, run a v2 batch,
          and the new version will appear here for comparison.
        </p>
      </div>
    </main>
  )
}
