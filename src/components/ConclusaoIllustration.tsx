import { useEffect, useState } from 'react'
import { useLottie } from 'lottie-react'

type LottieJson = Record<string, unknown>

function Player({ data }: { data: LottieJson }) {
  const [isReady, setIsReady] = useState(false)
  const { View, animationItem } = useLottie(
    {
      animationData: data,
      loop: true,
      // autoplay disabled so we control the load → seek → play sequence.
      autoplay: false,
    },
    { width: '100%', height: '100%' }
  )

  useEffect(() => {
    if (!animationItem) return
    // Park the playhead at frame 0 BEFORE the canvas becomes visible.
    // goToAndStop guarantees no half-rendered frame leaks through.
    animationItem.goToAndStop(0, true)
    setIsReady(true)
    // Resume on the next paint so the user sees frame 0 first, then playback.
    const raf = requestAnimationFrame(() => animationItem.play())
    return () => cancelAnimationFrame(raf)
  }, [animationItem])

  // Inner opacity gate: invisible until the seek lands. The outer hero wrapper
  // in Conclusao.tsx drives the 800ms fade — this gate just hides the
  // pre-seek flash. Once isReady flips, opacity multiplies through to 1.
  return (
    <div className="w-full h-full" style={{ opacity: isReady ? 1 : 0 }}>
      {View}
    </div>
  )
}

export default function ConclusaoIllustration() {
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

  // Approach 2 hardening: don't even mount the Lottie until JSON is fetched,
  // so the component never renders with empty/transient data.
  if (!data) {
    return <div className="w-full h-full" aria-hidden />
  }

  return <Player data={data} />
}
