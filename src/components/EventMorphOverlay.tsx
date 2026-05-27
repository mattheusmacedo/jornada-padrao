import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion as fmotion } from 'framer-motion'
import { RAYE_MORPH_IDS } from '../motion/eventMorphIds'
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

type Props = { onClose: () => void }

const MORPH_TRANSITION = { type: 'spring', stiffness: 200, damping: 24 } as const

// CTAFooter lives outside the stagger group's scroll body, so it needs its
// own reveal with a delay calibrated to land after the in-scroll stagger.
// Group delay-children is 0.32 + 4 items × 0.05 = 0.52. CTA reveals at 0.5
// so it lands roughly with the last in-scroll item.
const CTA_REVEAL = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.5, duration: 0.2, ease: [0, 0, 0.2, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    y: 6,
    transition: { duration: 0.12, ease: [0, 0, 0.2, 1] as [number, number, number, number] },
  },
}

/**
 * RAYE detail overlay launched from Perfil. Three shared layoutIds (container,
 * hero image, title) handle the cross-route morph; destination-only content
 * (FansPill, the three info rows, AboutBlock, CTA) reveals AFTER the morph
 * via the detailRevealGroup stagger so icons/text don't deform during the
 * container scale.
 *
 * Renders via portal to document.body so the overlay stacks above PhoneFrame
 * chrome (BottomNav, StatusBar) without touching the route.
 */
export default function EventMorphOverlay({ onClose }: Props) {
  const navigate = useNavigate()
  return createPortal(
    <>
      <fmotion.div
        className="fixed inset-0 z-30 bg-white/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <div className="fixed inset-0 z-40 pointer-events-none flex">
        <fmotion.div
          layoutId={RAYE_MORPH_IDS.container}
          transition={MORPH_TRANSITION}
          style={{ borderRadius: 0 }}
          className="pointer-events-auto h-full w-full flex flex-col bg-white overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <EventHero onBack={onClose} imageLayoutId={RAYE_MORPH_IDS.image} />

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
    </>,
    document.body
  )
}
