import { useNavigate } from 'react-router-dom'
import { motion as fmotion } from 'framer-motion'
import type { EventMorphIds } from '../motion/eventMorphIds'
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

type Props = {
  onClose: () => void
  /** Per-tab shared layoutIds. Perfil and Explorar each pass their own set
   *  so the morph stays scoped to the tab that launched the overlay. */
  morphIds: EventMorphIds
}

const MORPH_TRANSITION = { type: 'spring', stiffness: 200, damping: 24 } as const

// CTAFooter lives outside the stagger group's scroll body so it needs its
// own reveal calibrated to land after the in-scroll stagger. Exit is a
// fast fade with no y travel — matches detailRevealItem's instant-exit
// principle so the close doesn't ping-pong.
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
 * RAYE detail overlay launched from Perfil/Explorar. Two shared layoutIds
 * (container, hero image) handle the card → page morph; destination-only
 * content (FansPill, title, the three info rows, AboutBlock, CTA) reveals
 * AFTER the morph via the detailRevealGroup stagger.
 *
 * Rendered INLINE inside each screen's LayoutGroup — no portal — so the
 * source card and the morph destination are siblings within the same
 * layout context. Portaling to document.body broke FM's projection
 * relationship across the boundary, especially with morph IDs that
 * arm/disarm after mount. The trade-off: the overlay no longer covers
 * PhoneFrame chrome (BottomNav) by default. If needed, expose an overlay
 * slot on PhoneFrame in a follow-up — do NOT re-portal.
 */
export default function EventMorphOverlay({ onClose, morphIds }: Props) {
  const navigate = useNavigate()
  return (
    <>
      {/* Subtle app-dimming scrim. Pure white at 40% was washing out the
          morph shell against the light background — a soft black tint
          recedes the page underneath without modal-darkening it. */}
      <fmotion.div
        className="absolute inset-0 z-30 bg-black/[0.04]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <div className="absolute inset-0 z-40 pointer-events-none flex">
        {/* Visible shell: soft drop shadow + 1px ring so the user reads
            "card surface expanding into page" instead of "white-on-white
            hero image appearing". The same element carries the layoutId. */}
        <fmotion.div
          layoutId={morphIds.container}
          transition={MORPH_TRANSITION}
          style={{
            borderRadius: 0,
            boxShadow: '0 18px 60px rgba(15, 23, 42, 0.16)',
          }}
          className="pointer-events-auto h-full w-full flex flex-col bg-white overflow-hidden ring-1 ring-black/[0.04]"
        >
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <EventHero onBack={onClose} imageLayoutId={morphIds.image} />

            {/* One stagger group containing FansPill → Title → rows → about.
                The title no longer shares a layoutId with the source card —
                it reveals here as a stagger item instead of morphing from the
                yellow card label. FansPill stays first so its -mt-[30px]
                overlaps the hero, not the title. */}
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
      </div>
    </>
  )
}
