import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'

type Props = {
  /** Base path without extension, e.g. "/videos/state-machine/idle". */
  src: string
  /** Fires when current playback completes — the parent state machine may
   *  update state from here. If the update changes `src`, the underlying
   *  <video> remounts (via key={src}) and the new clip auto-plays. If the
   *  update does NOT change `src`, this component restarts the SAME <video>
   *  by seeking to 0 — no remount, no transparent flash. */
  onEnded?: () => void
  /** Fires on tap. */
  onClick?: () => void
  className?: string
  style?: CSSProperties
}

/**
 * Alpha-channel video element using a dual-format <source> chain.
 *
 * Currently only WebM VP9 alpha is shipped (Path 1 — encoded on Windows).
 * Drop sibling .mp4 (HEVC alpha, encoded on macOS via hevc_videotoolbox) into
 * 2_SOURCE/footages/VIDEO/ and uncomment the second <source> line below to
 * extend coverage to Safari ≤ 17.
 *
 * LOOPING POLICY:
 * - When the parent leaves `src` unchanged after onEnded, the SAME <video>
 *   element is reused; we seek to 0 and call play() on it. The decoder stays
 *   warm and the next frame paints immediately — no transparent flash.
 * - When the parent changes `src` (state transition), the internal
 *   key={src} remounts <video> so the new clip loads from scratch. The
 *   loops were authored to match at the seam, so this cut is invisible.
 */
export default function AlphaVideo({ src, onEnded, onClick, className, style }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  // Tracks the latest src after every render so the onEnded rAF callback
  // can tell whether the parent's state update changed src or not.
  const latestSrcRef = useRef(src)
  useEffect(() => {
    latestSrcRef.current = src
  }, [src])

  const handleEnded = () => {
    const oldSrc = src
    onEnded?.()
    // After parent's onEnded may have updated state and React may have
    // re-rendered, check on the next frame whether our src still matches.
    // - Same src → no state transition → seek-to-0 on the persistent <video>
    // - Different src → React already swapped to a new <video> via key={src}
    //   which auto-plays the new clip; nothing for us to do here.
    requestAnimationFrame(() => {
      if (latestSrcRef.current === oldSrc && videoRef.current) {
        videoRef.current.currentTime = 0
        videoRef.current.play().catch(() => {
          // Swallow autoplay rejections — muted + playsInline videos almost
          // never trip this, and there's nothing useful we can do mid-loop.
        })
      }
    })
  }

  return (
    <video
      ref={videoRef}
      key={src}
      autoPlay
      muted
      playsInline
      preload="auto"
      onEnded={handleEnded}
      onClick={onClick}
      className={className}
      style={style}
    >
      <source src={`${src}.webm`} type="video/webm; codecs=vp9" />
      {/* <source src={`${src}.mp4`} type='video/mp4; codecs=hvc1' />  ← add when MP4 alpha files exist (Path 2) */}
    </video>
  )
}
