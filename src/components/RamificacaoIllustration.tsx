import { useEffect, useState } from 'react'
import { useLottie } from 'lottie-react'

// Intro plays frames 0 → (totalFrames - 26), then the idle loops the last 26
// frames. The intro hands off to the loop on the same frame so there's no
// visible jump-back at the seam.
const IDLE_LOOP_FRAMES = 26

type Selection = 'salvos' | 'favoritos'
type LottieJson = Record<string, unknown>

const PATH_BY_SELECTION: Record<Selection, string> = {
  salvos: '/illustrations/ramificacao.json',
  favoritos: '/illustrations/ramificacao3.json',
}

type Props = { selection: Selection }

function Player({ data }: { data: LottieJson }) {
  const { View, playSegments, animationItem } = useLottie(
    {
      animationData: data,
      loop: false,
      autoplay: false,
      onComplete: () => {
        if (!animationItem) return
        const total = animationItem.totalFrames
        const idleStart = Math.max(0, total - IDLE_LOOP_FRAMES)
        animationItem.loop = true
        playSegments([idleStart, total], true)
      },
    },
    { width: '100%', height: '100%' }
  )

  // Once the animation is loaded, kick off the intro: play 0 → idleStart.
  // onComplete then takes over and loops [idleStart, total].
  useEffect(() => {
    if (!animationItem) return
    const total = animationItem.totalFrames
    const idleStart = Math.max(0, total - IDLE_LOOP_FRAMES)
    playSegments([0, idleStart], true)
  }, [animationItem, playSegments])

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
