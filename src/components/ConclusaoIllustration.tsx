import { useEffect, useState } from 'react'
import { useLottie } from 'lottie-react'

type LottieJson = Record<string, unknown>

function Player({ data }: { data: LottieJson }) {
  const { View } = useLottie(
    {
      animationData: data,
      loop: true,
      autoplay: true,
    },
    { width: '100%', height: '100%' }
  )
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
