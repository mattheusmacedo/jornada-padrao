// Registry of GLB iteration versions available for /model-sandbox to A/B
// against the original FBX. Each version corresponds to .v{N}.glb files
// produced by scripts/convert-fbx-to-glb.mjs.
//
// Append to this list whenever you re-run the converter to make the new
// snapshot selectable in the sandbox toggle. The canonical .glb (what the
// runtime app loads) is always the latest entry here.

export const GLB_VERSIONS = ['v1', 'v2', 'v3'] as const

export type GlbVersion = (typeof GLB_VERSIONS)[number]
