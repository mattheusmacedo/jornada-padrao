import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion as fmotion } from 'framer-motion'
import { PageTransition } from '../motion/transitions'
import {
  heroVariants,
  pressButton,
  pressTransition,
} from '../motion/variants'
import AlphaVideo from '../components/AlphaVideo'

type VideoState = 'conclusao-dance' | 'conclusao-idle'

export default function Conclusao() {
  const navigate = useNavigate()

  // State machine: on mount play dance twice, then settle into idle loop.
  // Two consecutive taps on the illustration re-arms a single dance pass.
  const [currentVideo, setCurrentVideo] = useState<VideoState>('conclusao-dance')
  const dancePassesRef = useRef(0) // counts dance plays in the current sequence
  const pendingDanceRef = useRef(false) // queued single dance from a 2-tap
  const tapCountRef = useRef(0)

  const handleEnded = () => {
    if (currentVideo === 'conclusao-dance') {
      dancePassesRef.current += 1
      // Auto sequence on entry: dance plays twice before settling.
      if (dancePassesRef.current < 2 && !pendingDanceRef.current) {
        // Trigger a re-mount of the same clip so it replays from frame 0.
        // setState with the same value would bail out — bump via setter form.
        setCurrentVideo((v) => (v === 'conclusao-dance' ? 'conclusao-dance' : v))
        // Force the AlphaVideo to remount by toggling and restoring next tick.
        // Cleaner: use a small bump key (see remountTick below).
        setRemountTick((t) => t + 1)
        return
      }
      // Dance is done — fall back to idle.
      dancePassesRef.current = 0
      setCurrentVideo('conclusao-idle')
      return
    }

    // currentVideo === 'conclusao-idle'
    if (pendingDanceRef.current) {
      pendingDanceRef.current = false
      dancePassesRef.current = 0
      // Play dance once when re-armed by a 2-tap. After it ends, the
      // dancePassesRef === 1 path above transitions back to idle.
      // We set dancePassesRef to 1 directly so dance plays exactly once.
      dancePassesRef.current = 1
      setCurrentVideo('conclusao-dance')
      return
    }
    // Idle just loops — re-key the same src to replay from frame 0.
    setRemountTick((t) => t + 1)
  }

  // remountTick lets us re-fire AlphaVideo's `key` without changing src — for
  // looping the same clip from frame 0 on its onEnded.
  const [remountTick, setRemountTick] = useState(0)

  // Tap counter on the illustration: 2 consecutive taps (no time window)
  // arm one more dance pass once the current clip finishes. The counter
  // resets on natural video-end without reaching 2 — keeps it forgiving so
  // accidental taps don't accumulate indefinitely.
  const handleIllustrationTap = () => {
    tapCountRef.current += 1
    if (tapCountRef.current >= 2) {
      tapCountRef.current = 0
      pendingDanceRef.current = true
    }
  }
  // Reset tap accumulator on video end so a slow series doesn't pile up.
  const handleEndedWithReset = () => {
    const beforeReset = pendingDanceRef.current
    tapCountRef.current = 0
    handleEnded()
    void beforeReset
  }

  return (
    <PageTransition>
      <div className="relative h-full flex flex-col items-center px-6 pt-[56px]">
        <fmotion.button
          type="button"
          aria-label="Fechar"
          onClick={() => navigate('/')}
          whileTap={pressButton}
          transition={pressTransition}
          className="absolute top-[8px] right-[18px] h-10 w-10 flex items-center justify-center text-white z-10"
        >
          <X size={24} strokeWidth={2.5} />
        </fmotion.button>

        {/* Illustration container — the video itself is the tap target.
            Tapping it twice re-arms a dance. The X dismiss button above
            is z-10 so it doesn't get covered by the tap surface. */}
        <div
          onClick={handleIllustrationTap}
          className="mt-[30px] w-[547px] h-[434px] cursor-pointer"
        >
          <AlphaVideo
            key={`${currentVideo}-${remountTick}`}
            src={`/videos/state-machine/${currentVideo}`}
            onEnded={handleEndedWithReset}
            className="w-full h-full"
            style={{ objectFit: 'contain' }}
          />
        </div>

        <fmotion.h1
          variants={heroVariants}
          initial="initial"
          animate="animate"
          className="mt-[32px] w-[280px] text-center text-white font-bold uppercase text-[22.8px] leading-tight no-underline"
          style={{ letterSpacing: '1.42px', textDecoration: 'none' }}
        >
          Evento<br />adicionado<br />ao seu perfil!
        </fmotion.h1>
      </div>
    </PageTransition>
  )
}
