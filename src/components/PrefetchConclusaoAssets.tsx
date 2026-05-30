// Mounts <link rel="prefetch"> tags for the heavy assets used by the
// /conclusao route (12 music-burst GLB models + character/dance state
// videos). Intended to be rendered inside /ramificacao so the network
// is warming up the next-screen payload while the user is making their
// decision — by the time they hit "continuar", the burst overlay can
// start instantly with no fetch stutter.
//
// Prefetch is low-priority; if the browser is busy with anything else
// it'll defer, so there's no first-paint impact on Ramificacao itself.
//
// Video format selection mirrors AlphaVideo's runtime detection — Safari/
// iOS prefetches .mov (HEVC), everyone else prefetches .webm — so we
// don't waste bandwidth pulling a format the browser will never play.

import { useEffect } from 'react'
import { MUSIC_BURST_MODEL_SPECS } from './musicBurstConfig'

const VIDEO_BASES = [
  '/videos/state-machine/conclusao-dance',
  '/videos/state-machine/conclusao-character-cowgirl',
  '/videos/state-machine/conclusao-character-glam',
  '/videos/state-machine/conclusao-character-pop',
  '/videos/state-machine/conclusao-character-raver',
]

function videoExtensionForCurrentBrowser(): '.mov' | '.webm' {
  if (typeof navigator === 'undefined') return '.webm'
  const ua = navigator.userAgent
  const vendor = navigator.vendor
  const isIOS = /iPad|iPhone|iPod/.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAppleSafari = vendor.includes('Apple')
    && /Safari/.test(ua)
    && !/Chrome|Chromium|CriOS|FxiOS|Edg|EdgiOS|OPR|OPT\//.test(ua)
  return isIOS || isAppleSafari ? '.mov' : '.webm'
}

export default function PrefetchConclusaoAssets() {
  useEffect(() => {
    const videoExt = videoExtensionForCurrentBrowser()
    const urls = [
      ...MUSIC_BURST_MODEL_SPECS.map((spec) => spec.path),
      ...VIDEO_BASES.map((base) => `${base}${videoExt}`),
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
