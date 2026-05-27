import { useNavigate } from 'react-router-dom'
import { motion as fmotion } from 'framer-motion'
import { detailRevealGroup, detailRevealItem } from '../motion/variants'
import { EventCardSurface, type EventCardSurfaceProps } from './EventCard'
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
  x: number
  y: number
  width: number
  height: number
  targetWidth: number
  targetHeight: number
}

type Props = {
  onClose: () => void
  /** Measured at click time. Initial+exit anchor for the FLIP morph. */
  sourceRect: MorphRect
  /** Visual props for the source-card face rendered inside the shell.
   *  The shell renders BOTH faces (source + destination) so the close
   *  reverse-FLIP lands on a card-looking surface, not a blank white
   *  rectangle. */
  sourceCard: EventCardSurfaceProps
}

const MORPH_TRANSITION = { type: 'spring', stiffness: 200, damping: 24 } as const
const EASE_OUT = [0, 0, 0.2, 1] as [number, number, number, number]

// Source face: visible at open start (shell = card rect), fades out as
// shell expands; on close it fades back in almost immediately and sits
// visible through the rest of the shrink so the landing frame already
// looks like the card.
const SOURCE_FACE = {
  initial: { opacity: 1 },
  animate: { opacity: 0, transition: { duration: 0.14, ease: EASE_OUT } },
  exit: { opacity: 1, transition: { delay: 0.02, duration: 0.16, ease: EASE_OUT } },
}

// Destination face: hidden at open start, fades in after a small delay
// so the source has begun receding first. On close it stays visible for
// the first beat while source fades back in — both layers overlap during
// the early collapse so there's never a pale empty-shell phase.
const DEST_FACE = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { delay: 0.06, duration: 0.14, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { delay: 0.08, duration: 0.16, ease: EASE_OUT } },
}

const CTA_REVEAL = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.6, duration: 0.2, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    y: 0,
    transition: { duration: 0.06, ease: EASE_OUT },
  },
}

/**
 * Measured FLIP morph with a two-face shell. Outer shell only animates
 * geometry (x/y/width/height/borderRadius). Inside, a source-card face
 * and a destination-detail face crossfade. The shell never has to fade
 * itself out — the visual handoff is owned by the inner layers, so the
 * close lands cleanly on a card-looking surface that matches the still-
 * hidden real card behind it.
 */
export default function EventMorphOverlay({ onClose, sourceRect, sourceCard }: Props) {
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
            boxShadow: '0 7px 24px rgba(64, 64, 64, 0.10)',
          }}
          animate={{
            x: 0,
            y: 0,
            width: sourceRect.targetWidth,
            height: sourceRect.targetHeight,
            borderRadius: 0,
            boxShadow: '0 18px 60px rgba(15, 23, 42, 0.16)',
          }}
          exit={{
            x: sourceRect.x,
            y: sourceRect.y,
            width: sourceRect.width,
            height: sourceRect.height,
            borderRadius: 16,
            // Drop the shell's own elevation as it lands so the source
            // face / real card is the only thing carrying shadow at the
            // final frame — no double-shadow pop on handoff.
            boxShadow: '0 0px 0px rgba(15, 23, 42, 0)',
          }}
          transition={MORPH_TRANSITION}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
          }}
          className="pointer-events-auto overflow-hidden"
        >
          {/* Source face — what the user sees at open start and at close end. */}
          <fmotion.div
            className="absolute inset-0"
            initial={SOURCE_FACE.initial}
            animate={SOURCE_FACE.animate}
            exit={SOURCE_FACE.exit}
          >
            <EventCardSurface {...sourceCard} />
          </fmotion.div>

          {/* Destination face — the full detail page. bg-white so it covers
              source while opacity ramps in. */}
          <fmotion.div
            className="absolute inset-0 flex flex-col bg-white"
            initial={DEST_FACE.initial}
            animate={DEST_FACE.animate}
            exit={DEST_FACE.exit}
          >
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <EventHero onBack={onClose} />

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
