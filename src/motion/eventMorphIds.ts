// Per-tab base layoutIds for the RAYE event card → detail-overlay morph.
//
// Each tab (Perfil, Explorar) has its OWN base id pair so the morph stays
// scoped to a single tab. On TOP of that, every open→close cycle uses a
// freshly-suffixed id pair (created via createEventMorphIds + a monotonic
// session counter) so FM never reuses a stale projection node from a
// previous cycle. Reusing always-armed ids across multiple open/close
// rounds eventually leaves FM without a clean source/destination pairing
// and the overlay hard-cuts instead of morphing.

export const PERFIL_RAYE_MORPH_IDS = {
  container: 'perfil-raye-1-container',
  image: 'perfil-raye-1-image',
} as const

export const EXPLORAR_RAYE_MORPH_IDS = {
  container: 'explorar-raye-1-container',
  image: 'explorar-raye-1-image',
} as const

export type EventMorphBaseIds =
  | typeof PERFIL_RAYE_MORPH_IDS
  | typeof EXPLORAR_RAYE_MORPH_IDS

export type EventMorphIds = {
  container: string
  image: string
}

export function createEventMorphIds(
  base: EventMorphBaseIds,
  session: number
): EventMorphIds {
  return {
    container: `${base.container}-${session}`,
    image: `${base.image}-${session}`,
  }
}
