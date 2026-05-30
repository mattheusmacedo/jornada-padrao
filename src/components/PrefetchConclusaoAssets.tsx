// Mounts <link rel="prefetch"> tags for the heavy assets used by the
// /conclusao route (12 music-burst GLB models + character/dance state
// videos). Intended to be rendered inside /ramificacao so the network
// is warming up the next-screen payload while the user is making their
// decision — by the time they hit "continuar", the burst overlay can
// start instantly with no fetch stutter.
//
// Prefetch is low-priority; if the browser is busy with anything else
// it'll defer, so there's no first-paint impact on Ramificacao itself.

import { useEffect } from 'react'
import { MUSIC_BURST_MODEL_SPECS } from './musicBurstConfig'

const VIDEO_ASSETS = [
  '/videos/state-machine/conclusao-dance.webm',
  '/videos/state-machine/conclusao-character-cowgirl.webm',
  '/videos/state-machine/conclusao-character-glam.webm',
  '/videos/state-machine/conclusao-character-pop.webm',
  '/videos/state-machine/conclusao-character-raver.webm',
]

export default function PrefetchConclusaoAssets() {
  useEffect(() => {
    const urls = [
      ...MUSIC_BURST_MODEL_SPECS.map((spec) => spec.path),
      ...VIDEO_ASSETS,
    ]
    const links = urls.map((href) => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.as = 'fetch'
      link.href = href
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
      return link
    })
    return () => {
      links.forEach((l) => l.remove())
    }
  }, [])
  return null
}
