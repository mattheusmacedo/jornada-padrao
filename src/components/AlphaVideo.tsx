import type { CSSProperties } from 'react'

type Props = {
  /** Base path without extension, e.g. "/videos/state-machine/idle". */
  src: string
  /** Fires when current playback completes — used by parent state machines
   *  to swap to the next clip on the seam. Do NOT set `loop` on the video. */
  onEnded?: () => void
  /** Fires on tap. Wrappers can also handle clicks on a parent div if they
   *  want the entire surrounding area as a hit target. */
  onClick?: () => void
  className?: string
  style?: CSSProperties
}

/**
 * Plays an alpha-channel video using a dual-format <source> chain.
 *
 * Currently only WebM VP9 alpha is shipped (Path 1 — encoded on Windows).
 * Drop a sibling .mp4 (HEVC alpha, encoded on macOS via hevc_videotoolbox)
 * into 2_SOURCE/footages/VIDEO/ and uncomment the second <source> line below
 * to extend coverage to Safari ≤ 17.
 *
 * The video element is keyed on `src` so changing `src` unmounts and remounts
 * — guarantees a clean reload and a fresh onLoadedData fire even if the
 * browser would otherwise cache or reuse the previous element.
 */
export default function AlphaVideo({ src, onEnded, onClick, className, style }: Props) {
  return (
    <video
      key={src}
      autoPlay
      muted
      playsInline
      preload="auto"
      onEnded={onEnded}
      onClick={onClick}
      className={className}
      style={style}
    >
      <source src={`${src}.webm`} type="video/webm; codecs=vp9" />
      {/* <source src={`${src}.mp4`} type='video/mp4; codecs=hvc1' />  ← add when MP4 alpha files exist (Path 2) */}
    </video>
  )
}
