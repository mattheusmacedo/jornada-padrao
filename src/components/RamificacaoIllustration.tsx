import { useEffect, useState } from 'react'
import { useLottie } from 'lottie-react'

// Strategy B for both clips: play full intro once, then loop the last 25% as
// the idle. Bounds are computed from animationItem.totalFrames at runtime so
// either clip can be re-cut without changing this file.
const IDLE_LOOP_FRACTION = 0.75

type Selection = 'salvos' | 'favoritos'
type LottieJson = Record<string, unknown>

const PATH_BY_SELECTION: Record<Selection, string> = {
  salvos: '/illustrations/ramificacao.json',
  favoritos: '/illustrations/ramificacao2.json',
}

type Props = { selection: Selection }

function Player({ data }: { data: LottieJson }) {
  const { View, playSegments, animationItem } = useLottie(
    {
      animationData: data,
      loop: false,
      autoplay: true,
      onComplete: () => {
        if (!animationItem) return
        const total = animationItem.totalFrames
        const idleStart = Math.round(total * IDLE_LOOP_FRACTION)
        animationItem.loop = true
        playSegments([idleStart, total], true)
      },
    },
    { width: '100%', height: '100%' }
  )
  return View
}

export default function RamificacaoIllustration({ selection }: Props) {
  const [data, setData] = useState<LottieJson | null>(null)
  const path = PATH_BY_SELECTION[selection]

  useEffect(() => {
    let cancelled = false
    fetch(path)
      .then((r) => r.json())
      .then((json: LottieJson) => {
        if (!cancelled) setData(json)
      })
      .catch((err) => console.warn('[RamificacaoIllustration] fetch failed', err))
    return () => {
      cancelled = true
    }
  }, [path])

  if (!data) {
    return <div className="w-full h-full" aria-hidden />
  }

  return <Player data={data} />
}
