// Stable per-tab container layoutId for the RAYE event card → detail-overlay
// morph. ONLY the container is shared. The hero image is NOT a shared layout
// element because Perfil's compact thumbnail and Explorar's fullbleed card
// have different source-image geometries — sharing the image layoutId across
// those would create asymmetric morph paths between the two tabs. The hero
// rides inside the morphing container instead, via a plain `layout` prop.
//
// Per-tab id strings keep the morph scoped to a single tab so Framer Motion
// never accidentally bridges a Perfil RAYE to an Explorar RAYE on tab swap.

export const PERFIL_RAYE_MORPH_IDS = {
  container: 'perfil-raye-1-container',
} as const

export const EXPLORAR_RAYE_MORPH_IDS = {
  container: 'explorar-raye-1-container',
} as const

export type EventMorphIds = {
  container: string
}
