// Per-tab shared layoutIds for the RAYE event card → detail-overlay morph.
//
// Each tab (Perfil, Explorar) has its OWN id set so the morph connects
// card→overlay *within the same tab* and never accidentally bridges across
// tabs. If Perfil and Explorar used the same layoutIds, switching routes
// would make FM try to morph the Perfil RAYE card into the Explorar RAYE
// card (since they'd share an id even though they're in different tabs).
//
// Only the container and the image morph — the title is NOT in this set
// (intentional; morphing the small orange label into the large detail
// title looked rubbery, so the title reveals via the stagger group on
// the overlay instead).

export const PERFIL_RAYE_MORPH_IDS = {
  container: 'perfil-raye-1-container',
  image: 'perfil-raye-1-image',
} as const

export const EXPLORAR_RAYE_MORPH_IDS = {
  container: 'explorar-raye-1-container',
  image: 'explorar-raye-1-image',
} as const

export type EventMorphIds =
  | typeof PERFIL_RAYE_MORPH_IDS
  | typeof EXPLORAR_RAYE_MORPH_IDS
