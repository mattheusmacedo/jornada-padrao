import { useEffect, useState } from 'react'
import { useLottie } from 'lottie-react'

type LottieJson = Record<string, unknown>

function Player({ data }: { data: LottieJson }) {
  const { View, animationItem } = useLottie(
    {
      animationData: data,
      loop: true,
      autoplay: true,
    },
    { width: '100%', height: '100%' }
  )

  // Defensive: force playhead to frame 0 once the animation is ready.
  // Without this, lottie-web sometimes hands back an AnimationItem whose
  // playhead is mid-clip (StrictMode double-mount, cached instances on
  // route re-entry, or initial-draw timing race).
  useEffect(() => {
    if (animationItem) {
      animationItem.goToAndPlay(0, true)
    }
  }, [animationItem])

  return View
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

  if (!data) {
    return <div className="w-full h-full" aria-hidden />
  }

  return <Player data={data} />
}
