import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion as fmotion } from 'framer-motion'
import { RAYE_MORPH_IDS } from '../motion/eventMorphIds'
import {
  EventHero,
  FansPill,
  EventTitle,
  InfoRows,
  AboutBlock,
  CTAFooter,
} from './event-detail'

type Props = { onClose: () => void }

const MORPH_TRANSITION = { type: 'spring', stiffness: 200, damping: 24 } as const

/**
 * RAYE detail rendered as a Motion-Primitives-style overlay launched from
 * Perfil. Three shared layoutIds (container, image, title) morph the trigger
 * card from its position in the Perfil list into a full-screen detail
 * surface. Renders via portal to document.body so the overlay stacks above
 * the PhoneFrame chrome (BottomNav, StatusBar) without touching the route.
 *
 * Inner composition is identical to the direct /evento route (both consume
 * src/components/event-detail.tsx) — the post-morph frame is pixel-equivalent
 * to landing on /evento directly.
 */
export default function EventMorphOverlay({ onClose }: Props) {
  const navigate = useNavigate()
  return createPortal(
    <>
      {/* Scrim — soft white wash over Perfil during the morph. Click closes. */}
      <fmotion.div
        className="fixed inset-0 z-30 bg-white/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      {/* Layer hosting the morphing surface. pointer-events-none on the
          outer; pointer-events-auto on the morphing surface itself. */}
      <div className="fixed inset-0 z-40 pointer-events-none flex">
        <fmotion.div
          layoutId={RAYE_MORPH_IDS.container}
          transition={MORPH_TRANSITION}
          style={{ borderRadius: 0 }}
          className="pointer-events-auto h-full w-full flex flex-col bg-white overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <EventHero onBack={onClose} imageLayoutId={RAYE_MORPH_IDS.image} />
            <FansPill />
            <EventTitle titleLayoutId={RAYE_MORPH_IDS.title} />
            <InfoRows />
            <AboutBlock />
            <div className="h-[20px]" />
          </div>
          <CTAFooter
            onClick={() => {
              onClose()
              navigate('/ramificacao')
            }}
          />
        </fmotion.div>
      </div>
    </>,
    document.body
  )
}
