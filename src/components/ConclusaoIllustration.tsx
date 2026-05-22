import { useEffect, useState } from 'react'
import { useLottie } from 'lottie-react'

type LottieJson = Record<string, unknown>
type Props = { onReady?: () => void }

function Player({ data, onReady }: { data: LottieJson; onReady?: () => void }) {
  const { View, animationItem } = useLottie(
    {
      animationData: data,
      loop: true,
      // autoplay disabled so we control the load → seek → play sequence.
      autoplay: false,
      // onDOMLoaded fires AFTER lottie-web has rendered the initial frame to
      // the SVG/canvas — earlier callbacks (onDataReady, onLoadedImages) fire
      // before pixels are actually on screen.
      onDOMLoaded: () => onReady?.(),
    },
    { width: '100%', height: '100%' }
  )

  useEffect(() => {
    if (!animationItem) return
    // Park playhead at frame 0 BEFORE anything becomes visible.
    animationItem.goToAndStop(0, true)
    const raf = requestAnimationFrame(() => animationItem.play())
    return () => cancelAnimationFrame(raf)
  }, [animationItem])

  return View
}

export default function ConclusaoIllustration({ onReady }: Props) {
  const [data, setData] = useState<LottieJson | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/illustrations/conclusao.json')
      .then((r) => r.json())
      .then((json: LottieJson) => {
        if (!cancelled) setData(json)
      })
      .catch((err) => console.warn('[ConclusaoIllustration] fetch failed', err))
    return () => {
      cancelled = true
    }
  }, [])

  if (!data) {
    return <div className="w-full h-full" aria-hidden />
  }

  return <Player data={data} onReady={onReady} />
}
