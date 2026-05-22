import { useEffect, useState } from 'react'
import { useLottie } from 'lottie-react'

// No markers in the source file (609 frames @ 60fps ≈ 10.15s). Strategy B:
// play the full clip once, then loop the last 25% (frames 456 → 609, ~2.5s)
// as a subtle idle. Bounds derived once from inspecting the source — adjust
// if the artist re-cuts the clip and the new natural settle point shifts.
const IDLE_START_FRAME = 456
const IDLE_END_FRAME = 609

type LottieJson = Record<string, unknown>

function Player({ data }: { data: LottieJson }) {
  const { View, playSegments, animationItem } = useLottie(
    {
      animationData: data,
      loop: false,
      autoplay: true,
      onComplete: () => {
        if (!animationItem) return
        animationItem.loop = true
        playSegments([IDLE_START_FRAME, IDLE_END_FRAME], true)
      },
    },
    { width: 220, height: 220 }
  )
  return View
}

export default function RamificacaoIllustration() {
  const [data, setData] = useState<LottieJson | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/illustrations/ramificacao.json')
      .then((r) => r.json())
      .then((json: LottieJson) => {
        if (!cancelled) setData(json)
      })
      .catch((err) => console.warn('[RamificacaoIllustration] fetch failed', err))
    return () => {
      cancelled = true
    }
  }, [])

  if (!data) {
    return <div className="w-[220px] h-[220px]" aria-hidden />
  }

  return <Player data={data} />
}
