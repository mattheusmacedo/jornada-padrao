import { useNavigate } from 'react-router-dom'
import { motion as fmotion } from 'framer-motion'
import { detailRevealGroup, detailRevealItem } from '../motion/variants'
import {
  EventHero,
  FansPill,
  EventTitle,
  DateRow,
  VenueRow,
  OrganizerRow,
  AboutBlock,
  CTAFooter,
} from './event-detail'

export type MorphRect = {
  /** Source card position relative to the screen-root. */
  x: number
  y: number
  /** Source card size. */
  width: number
  height: number
  /** Screen-root size — the morph's destination box. */
  targetWidth: number
  targetHeight: number
}

type Props = {
  onClose: () => void
  /** Measured at click time. Initial+exit anchor for the FLIP morph. */
  sourceRect: MorphRect
}

const MORPH_TRANSITION = { type: 'spring', stiffness: 200, damping: 24 } as const

// Single fade wrapper sitting INSIDE the morph shell. Owns the visible
// content lifecycle so the shell never has to crossfade itself to look
// clean. On exit, this is the thing the user actually sees disappearing —
// the shrinking white surface behind it then collapses onto the source
// card.
const CONTENT_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18, ease: [0, 0, 0.2, 1] as [number, number, number, number] } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: [0, 0, 0.2, 1] as [number, number, number, number] } },
}

// Hero gets a slight scale settle so the page feels alive immediately
// instead of opening to a blank white panel until detail rows arrive.
const HERO_REVEAL = {
  initial: { opacity: 0, scale: 1.02 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { delay: 0.06, duration: 0.18, ease: [0, 0, 0.2, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1, ease: [0, 0, 0.2, 1] as [number, number, number, number] },
  },
}

const CTA_REVEAL = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.6, duration: 0.2, ease: [0, 0, 0.2, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    y: 0,
    transition: { duration: 0.06, ease: [0, 0, 0.2, 1] as [number, number, number, number] },
  },
}

/**
 * Measured FLIP morph. The caller measures the source card and screen-root
 * rects at click time and passes them in via sourceRect. The shell starts
 * at the card's position/size, animates to the screen-root size, and on
 * close animates back to the same captured rect. Deterministic, no Framer
 * shared-layout projection — every cycle uses a fresh measurement.
 */
export default function EventMorphOverlay({ onClose, sourceRect }: Props) {
  const navigate = useNavigate()
  return (
    <>
      <fmotion.div
        className="absolute inset-0 z-30 bg-black/[0.04]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <div className="absolute inset-0 z-40 pointer-events-none">
        <fmotion.div
          initial={{
            x: sourceRect.x,
            y: sourceRect.y,
            width: sourceRect.width,
            height: sourceRect.height,
            borderRadius: 16,
            opacity: 1,
          }}
          animate={{
            x: 0,
            y: 0,
            width: sourceRect.targetWidth,
            height: sourceRect.targetHeight,
            borderRadius: 0,
            opacity: 1,
          }}
          exit={{
            x: sourceRect.x,
            y: sourceRect.y,
            width: sourceRect.width,
            height: sourceRect.height,
            borderRadius: 16,
            opacity: 0,
            // Shell stays opaque while it shrinks back to the card rect.
            // The inner content wrapper does the visible exit work (a
            // single quick fade); shell opacity is just a final 80ms tail
            // so the white surface vanishes onto the already-restored
            // source card without a visible crossfade.
            transition: {
              x: MORPH_TRANSITION,
              y: MORPH_TRANSITION,
              width: MORPH_TRANSITION,
              height: MORPH_TRANSITION,
              borderRadius: MORPH_TRANSITION,
              opacity: {
                delay: 0.28,
                duration: 0.08,
                ease: [0, 0, 0.2, 1] as [number, number, number, number],
              },
            },
          }}
          transition={MORPH_TRANSITION}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            boxShadow: '0 18px 60px rgba(15, 23, 42, 0.16)',
          }}
          className="pointer-events-auto flex flex-col bg-white overflow-hidden ring-1 ring-black/[0.04]"
        >
          {/* Everything visible inside the shell lives in one fade wrapper.
              On close it does the perceptible exit; the shell's own opacity
              tail just hides the surface once the content is already gone. */}
          <fmotion.div
            className="flex h-full w-full flex-col"
            initial={CONTENT_FADE.initial}
            animate={CONTENT_FADE.animate}
            exit={CONTENT_FADE.exit}
          >
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <fmotion.div
                initial={HERO_REVEAL.initial}
                animate={HERO_REVEAL.animate}
                exit={HERO_REVEAL.exit}
                style={{ transformOrigin: 'top center' }}
              >
                <EventHero onBack={onClose} />
              </fmotion.div>

              <fmotion.div
                variants={detailRevealGroup}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <fmotion.div variants={detailRevealItem}>
                  <FansPill />
                </fmotion.div>
                <fmotion.div variants={detailRevealItem}>
                  <EventTitle />
                </fmotion.div>
                <fmotion.div variants={detailRevealItem} className="mt-6">
                  <DateRow />
                </fmotion.div>
                <fmotion.div variants={detailRevealItem} className="mt-4">
                  <VenueRow />
                </fmotion.div>
                <fmotion.div variants={detailRevealItem} className="mt-4">
                  <OrganizerRow />
                </fmotion.div>
                <fmotion.div variants={detailRevealItem} className="mt-6">
                  <AboutBlock />
                </fmotion.div>
              </fmotion.div>
              <div className="h-[20px]" />
            </div>

            <fmotion.div
              initial={CTA_REVEAL.initial}
              animate={CTA_REVEAL.animate}
              exit={CTA_REVEAL.exit}
            >
              <CTAFooter
                onClick={() => {
                  onClose()
                  navigate('/ramificacao')
                }}
              />
            </fmotion.div>
          </fmotion.div>
        </fmotion.div>
      </div>
    </>
  )
}
