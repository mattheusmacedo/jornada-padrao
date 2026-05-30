import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { X } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion as fmotion, useAnimationControls } from 'framer-motion'
import { PageTransition } from '../motion/transitions'
import {
  heroVariants,
  pressButton,
  pressTransition,
} from '../motion/variants'
import AlphaVideo from '../components/AlphaVideo'
import MusicNotesOverlay from '../components/MusicNotesOverlay'
import { DEFAULT_MUSIC_NOTE_BURST_SETTINGS } from '../components/musicNotesConfig'
import type { MusicNoteBurstSettings } from '../components/musicNotesConfig'
import type { MusicNotesOverlayHandle } from '../components/MusicNotesOverlay'

type DanceVideoState = 'conclusao-dance'
type CharacterVideoState =
  | 'conclusao-character-cowgirl'
  | 'conclusao-character-glam'
  | 'conclusao-character-pop'
  | 'conclusao-character-raver'
type VideoState = 'idle' | DanceVideoState | CharacterVideoState
type TapPulse = { id: number; x: number; y: number; size: number; scale: number; opacity: number }

const DANCE_VIDEO: DanceVideoState = 'conclusao-dance'
const CHARACTER_VIDEOS = [
  'conclusao-character-cowgirl',
  'conclusao-character-glam',
  'conclusao-character-pop',
  'conclusao-character-raver',
] as const
const NOTE_SANDBOX_CONTROLS = [
  { key: 'amount', label: 'Objects', min: 1, max: 10, step: 1 },
  { key: 'size', label: 'Size', min: 0.45, max: 2.2, step: 0.05 },
  { key: 'speed', label: 'Speed', min: 0.35, max: 1.8, step: 0.05 },
  { key: 'duration', label: 'Life', min: 0.65, max: 2.4, step: 0.05 },
] as const
const SPECIAL_BURST_TAP_WINDOW_MS = 560
const SPECIAL_BURST_STAGGER_MS = 52
const SPECIAL_BURST_INTENSITY = 0.86

function getVideoBurstOrigin(videoRect?: DOMRect, frameRect?: DOMRect) {
  if (!videoRect) {
    return {
      x: frameRect ? frameRect.width * 0.5 : window.innerWidth * 0.5,
      y: frameRect ? frameRect.height * 0.5 : window.innerHeight * 0.5,
    }
  }

  return {
    x: videoRect.left - (frameRect?.left ?? 0) + videoRect.width * 0.5,
    y: videoRect.top - (frameRect?.top ?? 0) + videoRect.height * 0.5,
  }
}

function isCharacterVideo(video: VideoState): video is CharacterVideoState {
  return CHARACTER_VIDEOS.includes(video as CharacterVideoState)
}

function shuffleCharacters(previous?: CharacterVideoState | null) {
  const shuffled: CharacterVideoState[] = [...CHARACTER_VIDEOS]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }

  if (previous && shuffled[0] === previous && shuffled.length > 1) {
    const swapIndex = shuffled.findIndex((video) => video !== previous)
    ;[shuffled[0], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[0]]
  }

  return shuffled
}

function formatNoteSetting(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

function NoteBurstSandbox({
  settings,
  onChange,
  onReset,
  onTest,
}: {
  settings: MusicNoteBurstSettings
  onChange: (key: keyof MusicNoteBurstSettings, value: number) => void
  onReset: () => void
  onTest: () => void
}) {
  return (
    <div
      onPointerDown={(event) => event.stopPropagation()}
      className="absolute bottom-[12px] right-[12px] z-30 w-[330px] max-w-[calc(100%-24px)] rounded-[8px] border border-white/40 bg-white/92 px-3 py-2 text-[#34303a] shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-semibold leading-none">Notes Sandbox</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onTest}
            className="h-7 rounded-[7px] bg-[var(--color-pink-normal)] px-3 text-[11px] font-semibold text-white"
          >
            Test
          </button>
          <button
            type="button"
            onClick={onReset}
            className="h-7 rounded-[7px] border border-[#d8cad1] px-3 text-[11px] font-semibold text-[#34303a]"
          >
            Reset
          </button>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {NOTE_SANDBOX_CONTROLS.map((control) => (
          <label key={control.key} className="block">
            <span className="flex justify-between text-[10px] font-medium leading-none">
              <span>{control.label}</span>
              <span>{formatNoteSetting(settings[control.key])}</span>
            </span>
            <input
              type="range"
              min={control.min}
              max={control.max}
              step={control.step}
              value={settings[control.key]}
              onChange={(event) => onChange(control.key, Number(event.currentTarget.value))}
              className="mt-1 h-5 w-full accent-[var(--color-pink-normal)]"
            />
          </label>
        ))}
      </div>
    </div>
  )
}

export default function Conclusao() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const showNotesSandbox = searchParams.get('notesSandbox') === '1'

  // State machine: on mount play the dance clip, then settle into idle.
  // A quick double tap queues a dance and earns the special 3D burst. The
  // third tap upgrades the queued action into a character cameo without
  // re-firing the full burst, so the object cascade stays rare.
  const [currentVideo, setCurrentVideo] = useState<VideoState>(DANCE_VIDEO)
  const pendingVideoRef = useRef<VideoState | null>(null)
  const tapCountRef = useRef(0)
  const lastCharacterVideoRef = useRef<CharacterVideoState | null>(null)
  const characterQueueRef = useRef<CharacterVideoState[]>([])
  const tapPulseIdRef = useRef(0)
  const lastIllustrationTapAtRef = useRef<number | null>(null)
  const tapBurstIntensityRef = useRef(0)
  const screenRootRef = useRef<HTMLDivElement>(null)
  const illustrationRef = useRef<HTMLDivElement>(null)
  const musicNotesRef = useRef<MusicNotesOverlayHandle>(null)
  const videoFeedbackControls = useAnimationControls()
  const [tapPulses, setTapPulses] = useState<TapPulse[]>([])
  const [noteBurstSettings, setNoteBurstSettings] = useState<MusicNoteBurstSettings>({
    ...DEFAULT_MUSIC_NOTE_BURST_SETTINGS,
  })

  useEffect(() => {
    if (isCharacterVideo(currentVideo)) lastCharacterVideoRef.current = currentVideo
  }, [currentVideo])

  const queueDance = () => {
    pendingVideoRef.current = DANCE_VIDEO
  }

  const queueNextCharacter = () => {
    if (pendingVideoRef.current && isCharacterVideo(pendingVideoRef.current)) return

    if (characterQueueRef.current.length === 0) {
      characterQueueRef.current = shuffleCharacters(lastCharacterVideoRef.current)
    }

    const nextCharacter = characterQueueRef.current.shift()
    if (nextCharacter) pendingVideoRef.current = nextCharacter
  }

  const handleEnded = () => {
    if (currentVideo !== 'idle') {
      // Feature clips play exactly once per trigger, then return to idle.
      setCurrentVideo('idle')
      return false
    }

    if (pendingVideoRef.current) {
      const next = pendingVideoRef.current
      pendingVideoRef.current = null
      setCurrentVideo(next)
      return false
    }
    // Idle loops through AlphaVideo's hidden slot, so the visible frame stays
    // painted until the next loop has decoded.
  }

  // Two taps arms a dance; extra taps before the next state change turn that
  // pending dance into a character cameo.
  const handleIllustrationTap = (event: PointerEvent<HTMLDivElement>) => {
    const now = performance.now()
    const lastTapAt = lastIllustrationTapAtRef.current
    const tapInterval = lastTapAt === null ? 640 : now - lastTapAt
    const isFreshGesture = lastTapAt === null || tapInterval > SPECIAL_BURST_TAP_WINDOW_MS

    if (isFreshGesture) {
      tapCountRef.current = 0
      tapBurstIntensityRef.current = 0
    }

    const instantIntensity = Math.max(0, Math.min(1, (560 - tapInterval) / 400))
    const carriedIntensity = tapInterval > 720 ? 0 : tapBurstIntensityRef.current * 0.42
    const burstIntensity = Math.min(1, carriedIntensity + instantIntensity * 0.72)

    lastIllustrationTapAtRef.current = now
    tapBurstIntensityRef.current = burstIntensity

    const rect = event.currentTarget.getBoundingClientRect()
    const videoBurstOrigin = getVideoBurstOrigin(rect, screenRootRef.current?.getBoundingClientRect())
    const tapPulse: TapPulse = {
      id: tapPulseIdRef.current,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      size: 34,
      scale: 2.15,
      opacity: 0.9,
    }

    tapPulseIdRef.current += 1
    setTapPulses((pulses) => [...pulses.slice(-10), tapPulse])

    void videoFeedbackControls.start({
      scale: [1, 0.984, 1.015, 1],
      filter: [
        'brightness(1) saturate(1)',
        'brightness(1.16) saturate(1.12)',
        'brightness(1.08) saturate(1.06)',
        'brightness(1) saturate(1)',
      ],
      transition: { duration: 0.38, ease: 'easeOut' },
    })

    const nextTapCount = tapCountRef.current + 1
    tapCountRef.current = nextTapCount

    if (nextTapCount === 2) {
      queueDance()
      musicNotesRef.current?.burst(
        videoBurstOrigin,
        {
          intensity: SPECIAL_BURST_INTENSITY,
          laneStaggerMs: SPECIAL_BURST_STAGGER_MS,
          stagger: true,
        },
      )
    }

    if (nextTapCount === 3) {
      queueNextCharacter()
    }

    if (nextTapCount > 3) queueNextCharacter()
  }

  // Reset tap accumulator on video end so a slow series does not pile up.
  const handleEndedWithReset = () => {
    tapCountRef.current = 0
    return handleEnded()
  }

  const updateNoteBurstSetting = (key: keyof MusicNoteBurstSettings, value: number) => {
    setNoteBurstSettings((settings) => ({ ...settings, [key]: value }))
  }

  const resetNoteBurstSettings = () => {
    setNoteBurstSettings({ ...DEFAULT_MUSIC_NOTE_BURST_SETTINGS })
  }

  const testNoteBurst = () => {
    musicNotesRef.current?.burst(
      getVideoBurstOrigin(
        illustrationRef.current?.getBoundingClientRect(),
        screenRootRef.current?.getBoundingClientRect(),
      ),
      {
        intensity: SPECIAL_BURST_INTENSITY,
        laneStaggerMs: SPECIAL_BURST_STAGGER_MS,
        stagger: true,
      },
    )
  }

  return (
    <PageTransition>
      <div ref={screenRootRef} className="relative h-full flex flex-col items-center overflow-hidden px-6 pt-[56px]">
        <MusicNotesOverlay
          ref={musicNotesRef}
          settings={noteBurstSettings}
          className="pointer-events-none absolute inset-0 z-20 h-full w-full"
        />
        <fmotion.button
          type="button"
          aria-label="Fechar"
          onClick={() => navigate('/')}
          whileTap={pressButton}
          transition={pressTransition}
          className="absolute top-[8px] right-[18px] h-10 w-10 flex items-center justify-center text-white z-30"
        >
          <X size={24} strokeWidth={2.5} />
        </fmotion.button>

        {/* Illustration container. The X dismiss button above is z-10 so it
            does not get covered by the tap surface. */}
        <fmotion.div
          ref={illustrationRef}
          onPointerDown={handleIllustrationTap}
          whileTap={{ scale: 0.982 }}
          transition={pressTransition}
          className="relative z-30 mt-[30px] w-[547px] h-[434px] cursor-pointer touch-manipulation"
        >
          <fmotion.div
            initial={false}
            animate={videoFeedbackControls}
            className="relative z-[2] h-full w-full pointer-events-none select-none"
            style={{ transformOrigin: '50% 46%', willChange: 'transform, filter' }}
          >
            <AlphaVideo
              src={`/videos/state-machine/${currentVideo}`}
              onEnded={handleEndedWithReset}
              className="h-full w-full pointer-events-none select-none"
              style={{ objectFit: 'contain' }}
            />
          </fmotion.div>
          <div className="pointer-events-none absolute inset-0 z-[3] overflow-visible">
            <AnimatePresence>
              {tapPulses.map((pulse) => (
                <fmotion.span
                  key={pulse.id}
                  className="absolute rounded-full border-[2px] border-white/90 bg-white/15 shadow-[0_0_22px_rgba(255,255,255,0.68)]"
                  style={{
                    left: pulse.x - pulse.size / 2,
                    top: pulse.y - pulse.size / 2,
                    width: pulse.size,
                    height: pulse.size,
                  }}
                  initial={{ scale: 0.3, opacity: pulse.opacity }}
                  animate={{ scale: pulse.scale, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.46, ease: 'easeOut' }}
                  onAnimationComplete={() => {
                    setTapPulses((pulses) => pulses.filter(({ id }) => id !== pulse.id))
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        </fmotion.div>

        <fmotion.h1
          variants={heroVariants}
          initial="initial"
          animate="animate"
          className="relative z-10 mt-[32px] w-[280px] text-center text-white font-bold uppercase text-[22.8px] leading-tight no-underline"
          style={{ letterSpacing: '1.42px', textDecoration: 'none' }}
        >
          Evento<br />adicionado<br />ao seu perfil!
        </fmotion.h1>
        {showNotesSandbox && (
          <NoteBurstSandbox
            settings={noteBurstSettings}
            onChange={updateNoteBurstSetting}
            onReset={resetNoteBurstSettings}
            onTest={testNoteBurst}
          />
        )}
      </div>
    </PageTransition>
  )
}
