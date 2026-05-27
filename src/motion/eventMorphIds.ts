// Stable per-tab layoutIds for the RAYE event card → detail-overlay morph.
//
// Each tab (Perfil, Explorar) has its OWN id pair — that's enough scoping to
// prevent Perfil and Explorar from cross-morphing. Within a tab the ids are
// permanent: the source card carries them as long as that tab is mounted,
// and the overlay reuses the same ids every time it opens. FM keeps a stable
// source projection for repeatable open/close cycles.

export const PERFIL_RAYE_MORPH_IDS = {
  container: 'perfil-raye-1-container',
  image: 'perfil-raye-1-image',
} as const

export const EXPLORAR_RAYE_MORPH_IDS = {
  container: 'explorar-raye-1-container',
  image: 'explorar-raye-1-image',
} as const

export type EventMorphIds = {
  container: string
  image: string
}
