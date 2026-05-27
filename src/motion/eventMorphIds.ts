// Shared layoutIds for the RAYE event card → detail-overlay morph. Only the
// container and the image are shared elements — the title is NOT in this
// set because morphing the small orange card label into the large black
// detail title looked rubbery. The destination title reveals separately
// via the stagger group on the overlay.
export const RAYE_MORPH_IDS = {
  container: 'event-raye-1-container',
  image: 'event-raye-1-image',
} as const
