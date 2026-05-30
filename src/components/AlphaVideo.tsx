import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

const VIDEO_ASSET_VERSION = '20260529-shared-idle-60'
const WEBP_ALPHA_ASSET_VERSION = '20260530-safari-webp-alpha-60'
const END_LEAD_SECONDS = 0.055

const ALPHA_CLIP_DURATIONS: Record<string, number> = {
  '/videos/state-machine/idle': 1.208333,
  '/videos/state-machine/idle-phone': 4.833333,
  '/videos/state-machine/idle-phone-2': 7.458333,
  '/videos/state-machine/idle-bands': 4.375,
  '/videos/state-machine/conclusao-dance': 7.291667,
  '/videos/state-machine/conclusao-character-cowgirl': 5.458333,
  '/videos/state-machine/conclusao-character-glam': 7.458333,
  '/videos/state-machine/conclusao-character-pop': 5.458333,
  '/videos/state-machine/conclusao-character-raver': 5.458333,
}

type Props = {
  /** Base path without extension, e.g. "/videos/state-machine/idle". */
  src: string
  /** Fires when current playback completes. Return false when the parent is
   *  about to change `src`; AlphaVideo will hold the last frame instead of
   *  briefly restarting the outgoing clip. */
  onEnded?: () => boolean | void
  /** Fires on tap. */
  onClick?: () => void
  className?: string
  style?: CSSProperties
  playbackStart?: number
  playbackEnd?: number
  visibleStart?: number
  visibleEnd?: number
  loopWhenSameSrc?: boolean
}

type VideoSlot = {
  src: string | null
  token: number
}

type VideoSlots = [VideoSlot, VideoSlot]
type ImageSlot = {
  src: string
  token: number
}

function shouldUseWebpAlphaFallback() {
  if (typeof navigator === 'undefined') return false

  const ua = navigator.userAgent
  const vendor = navigator.vendor
  const isIOS = /iPad|iPhone|iPod/.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAppleSafari = vendor.includes('Apple')
    && /Safari/.test(ua)
    && !/Chrome|Chromium|CriOS|FxiOS|Edg|EdgiOS|OPR|OPT\//.test(ua)

  return isIOS || isAppleSafari
}

function getClipDuration(src: string, playbackStart: number, playbackEnd?: number) {
  const endAt = playbackEnd ?? ALPHA_CLIP_DURATIONS[src] ?? 1.2
  return Math.max(0.1, endAt - playbackStart)
}

function getWebpAlphaSrc(src: string) {
  return `${src}.webp?v=${WEBP_ALPHA_ASSET_VERSION}`
}

function preloadImage(src: string) {
  return new Promise<void>((resolve) => {
    const image = new Image()
    let resolved = false
    const finish = () => {
      if (resolved) return
      resolved = true
      resolve()
    }

    image.decoding = 'async'
    image.onload = () => {
      if (image.decode) {
        image.decode().then(finish, finish)
        return
      }
      finish()
    }
    image.onerror = finish
    image.src = getWebpAlphaSrc(src)
  })
}

function playVideo(video: HTMLVideoElement) {
  video.play().catch(() => {
    // Muted inline videos should autoplay; ignore the rare rejection.
  })
}

function AlphaImageFallback({
  src,
  onEnded,
  onClick,
  className,
  style,
  playbackStart = 0,
  playbackEnd,
  loopWhenSameSrc = true,
}: Props) {
  const [activeSlot, setActiveSlot] = useState<ImageSlot>(() => ({ src, token: 0 }))
  const activeSlotRef = useRef<ImageSlot>(activeSlot)
  const latestSrcRef = useRef(src)
  const pendingSlotRef = useRef<ImageSlot | null>(null)
  const tokenRef = useRef(0)
  const preloadIdRef = useRef(0)
  const onEndedRef = useRef(onEnded)
  const loopWhenSameSrcRef = useRef(loopWhenSameSrc)
  const playbackStartRef = useRef(playbackStart)
  const playbackEndRef = useRef(playbackEnd)

  useEffect(() => {
    onEndedRef.current = onEnded
    loopWhenSameSrcRef.current = loopWhenSameSrc
    playbackStartRef.current = playbackStart
    playbackEndRef.current = playbackEnd
  }, [onEnded, loopWhenSameSrc, playbackStart, playbackEnd])

  const queueImageSlot = useCallback((nextSrc: string) => {
    const nextSlot = {
      src: nextSrc,
      token: tokenRef.current + 1,
    }
    tokenRef.current = nextSlot.token
    pendingSlotRef.current = nextSlot

    const preloadId = preloadIdRef.current + 1
    preloadIdRef.current = preloadId

    void preloadImage(nextSrc).then(() => {
      if (preloadIdRef.current !== preloadId) return
      if (pendingSlotRef.current?.token !== nextSlot.token) return

      activeSlotRef.current = nextSlot
      pendingSlotRef.current = null
      setActiveSlot(nextSlot)
    })
  }, [])

  useLayoutEffect(() => {
    latestSrcRef.current = src
    playbackStartRef.current = playbackStart
    playbackEndRef.current = playbackEnd

    if (src === activeSlotRef.current.src || src === pendingSlotRef.current?.src) return
    queueImageSlot(src)
  }, [src, playbackStart, playbackEnd, queueImageSlot])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const shouldLoopSameSrc = onEndedRef.current?.() !== false
      if (
        shouldLoopSameSrc
        && loopWhenSameSrcRef.current
        && latestSrcRef.current === activeSlotRef.current.src
      ) {
        queueImageSlot(activeSlotRef.current.src)
      }
    }, getClipDuration(activeSlot.src, playbackStart, playbackEnd) * 1000)

    return () => window.clearTimeout(timer)
  }, [activeSlot, playbackStart, playbackEnd, queueImageSlot])

  return (
    <div
      onClick={onClick}
      className={className}
      style={{ position: 'relative' }}
    >
      <img
        key={`${activeSlot.token}-${activeSlot.src}`}
        src={getWebpAlphaSrc(activeSlot.src)}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="absolute inset-0 h-full w-full"
        style={{
          ...style,
          pointerEvents: 'none',
          transition: 'none',
        }}
      />
    </div>
  )
}

/**
 * Alpha-channel video element using a dual-format runtime strategy.
 *
 * LOOPING POLICY:
 * - Same `src` after onEnded: preload a fresh copy in the hidden slot, then
 *   swap only after the decoder has a frame ready.
 * - Different `src` after onEnded: preload the next clip in the hidden slot,
 *   then hard-swap it in only after the decoder has a frame ready.
 */
function AlphaVideoElement({
  src,
  onEnded,
  onClick,
  className,
  style,
  playbackStart = 0,
  playbackEnd,
  visibleStart,
  visibleEnd,
  loopWhenSameSrc = true,
}: Props) {
  const [slots, setSlots] = useState<VideoSlots>(() => [
    { src, token: 0 },
    { src: null, token: 1 },
  ])
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeVisible, setActiveVisible] = useState(() => visibleStart === undefined || visibleStart <= 0)
  const videoRefs = useRef<[HTMLVideoElement | null, HTMLVideoElement | null]>([null, null])
  const slotsRef = useRef<VideoSlots>(slots)
  const activeIndexRef = useRef(0)
  const activeSrcRef = useRef(src)
  const pendingSrcRef = useRef<string | null>(null)
  const pendingTokenRef = useRef<number | null>(null)
  const latestSrcRef = useRef(src)
  const playbackStartRef = useRef(playbackStart)
  const playbackEndRef = useRef(playbackEnd)
  const visibleStartRef = useRef(visibleStart)
  const visibleEndRef = useRef(visibleEnd)
  const activeVisibleRef = useRef(visibleStart === undefined || visibleStart <= 0)
  const completedRef = useRef(false)
  const progressFrameRef = useRef<number | null>(null)

  useEffect(() => {
    slotsRef.current = slots
  }, [slots])

  const queuePendingSlot = useCallback((nextSrc: string) => {
    const pendingIndex = activeIndexRef.current === 0 ? 1 : 0
    const pendingToken = slotsRef.current[pendingIndex].token + 2
    pendingSrcRef.current = nextSrc
    pendingTokenRef.current = pendingToken

    setSlots((current) => {
      const next: VideoSlots = [current[0], current[1]]
      next[pendingIndex] = {
        src: nextSrc,
        token: pendingToken,
      }
      return next
    })
  }, [])

  useLayoutEffect(() => {
    latestSrcRef.current = src
    playbackStartRef.current = playbackStart
    playbackEndRef.current = playbackEnd
    visibleStartRef.current = visibleStart
    visibleEndRef.current = visibleEnd
    if (src === activeSrcRef.current || src === pendingSrcRef.current) return

    queuePendingSlot(src)
  }, [src, playbackStart, playbackEnd, visibleStart, visibleEnd, queuePendingSlot])

  const activatePendingSlot = (index: number) => {
    const slot = slotsRef.current[index]
    if (!slot.src || slot.src !== pendingSrcRef.current) return
    if (slot.token !== pendingTokenRef.current) return

    const nextVideo = videoRefs.current[index]
    if (!nextVideo) return

    const startAt = playbackStartRef.current
    if (
      nextVideo.ended
      || nextVideo.currentTime < startAt
      || nextVideo.currentTime > startAt + 0.05
    ) {
      nextVideo.currentTime = startAt
      return
    }
    playVideo(nextVideo)

    activeIndexRef.current = index
    activeSrcRef.current = slot.src
    pendingSrcRef.current = null
    pendingTokenRef.current = null
    completedRef.current = false
    setActiveIndex(index)
    updateActiveVisibility(nextVideo)
    scheduleProgressCheck()

    const previousIndex = index === 0 ? 1 : 0
    videoRefs.current[previousIndex]?.pause()
  }

  const preparePendingSlot = (index: number) => {
    const slot = slotsRef.current[index]
    if (!slot.src || slot.src !== pendingSrcRef.current) return
    if (slot.token !== pendingTokenRef.current) return

    const pendingVideo = videoRefs.current[index]
    const startAt = playbackStartRef.current
    if (pendingVideo && startAt > 0 && pendingVideo.currentTime < startAt - 0.05) {
      pendingVideo.currentTime = startAt
    }
  }

  const completeActiveSlot = (index: number) => {
    if (index !== activeIndexRef.current || completedRef.current) return

    stopProgressCheck()
    const video = videoRefs.current[index]
    const oldSrc = activeSrcRef.current
    video?.pause()
    completedRef.current = true
    const shouldLoopSameSrc = onEnded?.() !== false

    window.setTimeout(() => {
      if (!shouldLoopSameSrc) return
      if (latestSrcRef.current === oldSrc && activeIndexRef.current === index && video) {
        if (!loopWhenSameSrc) return
        queuePendingSlot(oldSrc)
      }
    }, 0)
  }

  function stopProgressCheck() {
    if (progressFrameRef.current === null) return

    window.cancelAnimationFrame(progressFrameRef.current)
    progressFrameRef.current = null
  }

  function scheduleProgressCheck() {
    stopProgressCheck()
    progressFrameRef.current = window.requestAnimationFrame(checkProgress)
  }

  function checkProgress() {
    progressFrameRef.current = null
    if (completedRef.current) return

    const index = activeIndexRef.current
    const video = videoRefs.current[index]
    if (!video || !Number.isFinite(video.duration) || video.duration <= END_LEAD_SECONDS) return
    updateActiveVisibility(video)

    const playbackEndAt = playbackEndRef.current
    if (playbackEndAt !== undefined && video.currentTime >= playbackEndAt) {
      completeActiveSlot(index)
      return
    }
    if (video.duration - video.currentTime <= END_LEAD_SECONDS) {
      completeActiveSlot(index)
      return
    }

    progressFrameRef.current = window.requestAnimationFrame(checkProgress)
  }

  const handleTimeUpdate = (index: number) => {
    if (index !== activeIndexRef.current) return
    checkProgress()
  }

  function updateActiveVisibility(video: HTMLVideoElement) {
    const visibleStartAt = visibleStartRef.current
    const visibleEndAt = visibleEndRef.current
    const nextVisible = (
      (visibleStartAt === undefined || video.currentTime >= visibleStartAt)
      && (visibleEndAt === undefined || video.currentTime <= visibleEndAt)
    )

    if (nextVisible === activeVisibleRef.current) return
    activeVisibleRef.current = nextVisible
    setActiveVisible(nextVisible)
  }

  useEffect(() => {
    scheduleProgressCheck()
    return stopProgressCheck
  })

  useLayoutEffect(() => {
    const pendingSrc = pendingSrcRef.current
    if (!pendingSrc) return

    const pendingIndex = activeIndexRef.current === 0 ? 1 : 0
    const pendingVideo = videoRefs.current[pendingIndex]
    if (pendingVideo && pendingVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      activatePendingSlot(pendingIndex)
    }
  })

  return (
    <div
      onClick={onClick}
      className={className}
      style={{ position: 'relative' }}
    >
      {slots.map((slot, index) => slot.src && (
        <video
          ref={(node) => {
            videoRefs.current[index] = node
          }}
          key={`${slot.token}-${slot.src}`}
          autoPlay={index === activeIndex}
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={() => preparePendingSlot(index)}
          onCanPlay={() => activatePendingSlot(index)}
          onLoadedData={() => activatePendingSlot(index)}
          onSeeked={() => activatePendingSlot(index)}
          onTimeUpdate={() => handleTimeUpdate(index)}
          onEnded={() => completeActiveSlot(index)}
          className="absolute inset-0 h-full w-full"
          style={{
            ...style,
            opacity: index === activeIndex && activeVisible ? 1 : 0,
            pointerEvents: 'none',
            transition: 'none',
          }}
        >
          <source src={`${slot.src}.webm?v=${VIDEO_ASSET_VERSION}`} type="video/webm; codecs=vp9" />
        </video>
      ))}
    </div>
  )
}

export default function AlphaVideo(props: Props) {
  const [useWebpFallback] = useState(shouldUseWebpAlphaFallback)

  return useWebpFallback ? (
    <AlphaImageFallback {...props} />
  ) : (
    <AlphaVideoElement {...props} />
  )
}
