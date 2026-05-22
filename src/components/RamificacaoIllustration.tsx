import { useEffect, useRef, useState } from 'react'
import Lottie, { type LottieRefCurrentProps } from 'lottie-react'

// No markers in the source file (609 frames @ 60fps ≈ 10.15s). Strategy B:
// play the full clip once, then loop the last 25% (frames 456 → 609, ~2.5s)
// as a subtle idle. Bounds derived once from inspecting the source — adjust
// if the artist re-cuts the clip and the new natural settle point shifts.
const IDLE_START_FRAME = 456
const IDLE_END_FRAME = 609

type LottieJson = Record<string, unknown>

export default function RamificacaoIllustration() {
  const [data, setData] = useState<LottieJson | null>(null)
  const lottieRef = useRef<LottieRefCurrentProps>(null)

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

  const handleIntroDone = () => {
    const anim = lottieRef.current?.animationItem
    if (!anim) return
    anim.loop = true
    lottieRef.current?.playSegments([IDLE_START_FRAME, IDLE_END_FRAME], true)
  }

  // Placeholder while fetching so layout doesn't jump.
  if (!data) {
    return <div className="w-[220px] h-[220px]" aria-hidden />
  }

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={data}
      loop={false}
      autoplay
      onComplete={handleIntroDone}
      style={{ width: 220, height: 220 }}
    />
  )
}
