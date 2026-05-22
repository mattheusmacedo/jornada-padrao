import { useEffect, useState } from 'react'
import { useLottie } from 'lottie-react'

// 184 frames @ 24fps ≈ 7.67s. No markers in the source. Strategy B mirroring
// RamificacaoIllustration: play full clip once, then loop the last 25%
// (frames 138 → 184, ~1.92s) as the idle. onIntroComplete fires once when
// the full intro playback ends so the parent can sequence the title reveal.
const IDLE_START_FRAME = 138
const IDLE_END_FRAME = 184

type LottieJson = Record<string, unknown>

type Props = { onIntroComplete?: () => void }

function Player({ data, onIntroComplete }: { data: LottieJson; onIntroComplete?: () => void }) {
  const { View, playSegments, animationItem } = useLottie(
    {
      animationData: data,
      loop: false,
      autoplay: true,
      onComplete: () => {
        onIntroComplete?.()
        if (!animationItem) return
        animationItem.loop = true
        playSegments([IDLE_START_FRAME, IDLE_END_FRAME], true)
      },
    },
    { width: '100%', height: '100%' }
  )
  return View
}

export default function ConclusaoIllustration({ onIntroComplete }: Props) {
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

  return <Player data={data} onIntroComplete={onIntroComplete} />
}
