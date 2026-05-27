import { Ticket } from 'lucide-react'
import { motion as fmotion } from 'framer-motion'
import {
  listItemVariants,
  pressCardStandard,
  pressTransition,
} from '../motion/variants'

const MORPH_TRANSITION = { type: 'spring', stiffness: 200, damping: 24 } as const
const SUPPRESS_TRANSITION = { duration: 0.12, ease: [0, 0, 0.2, 1] as [number, number, number, number] }

type CommonProps = {
  image: string
  title: string
  date: string
  venue: string
  location: string
  badgeCount?: number
  onClick?: () => void
  /** Shared layoutIds for the card → overlay morph. The container morphs
   *  the card box; the image morphs from thumb to hero. The title is NOT
   *  shared — it disappears with the source card and the destination title
   *  reveals separately via the stagger group on the overlay.
   *
   *  IMPORTANT: only pass these while the morph is actively transitioning.
   *  An always-mounted layoutId creates an FM projection node that can
   *  pollute the card's position during list entrance/tab swap. Callers
   *  arm the ids on tap, then disarm them via AnimatePresence.onExitComplete. */
  cardLayoutId?: string
  imageLayoutId?: string
  /** When true, the source-only content (title, badge, date/venue) fades
   *  to opacity 0. Used by Perfil to hide the card's text during both the
   *  open and close morph so it never visually deforms inside the shrinking
   *  container. The image stays visible — it's the shared morph element. */
  suppressContent?: boolean
  /** Disables the press-scale (whileTap) on cards that are morph candidates,
   *  regardless of whether the morph is currently armed. Without this, a
   *  press in flight at the moment cardLayoutId arms would scale the source
   *  rect FM captures, producing a small jump on morph start. */
  disablePress?: boolean
  /** Visually hides the inner morph surface while keeping its layout box
   *  in flow. Use during an active card→page morph so the destination is
   *  the only visible owner of the surface, but FM can still measure the
   *  source rect via its still-mounted DOM node. Uses `visibility: hidden`
   *  (not `display: none`) — layout stays, paint goes away. */
  hideSourceVisual?: boolean
}

type Props = CommonProps & { variant?: 'compact' | 'fullbleed' }

export default function EventCard({ variant = 'compact', ...props }: Props) {
  return variant === 'fullbleed' ? <FullbleedCard {...props} /> : <CompactCard {...props} />
}

function Badge({ count }: { count: number }) {
  return (
    <span className="bg-[var(--color-orange-normal)] text-[var(--color-orange-light)] text-[11px] rounded-[5px] px-[5px] py-[2px] flex items-center gap-[3px] shrink-0">
      <Ticket size={11} strokeWidth={2.5} />
      {count}
    </span>
  )
}

function CompactCard({ image, title, date, venue, location, badgeCount = 1, onClick, cardLayoutId, imageLayoutId, suppressContent = false, disablePress = false, hideSourceVisual = false }: CommonProps) {
  // Two-layer split: outer wrapper handles list-entrance stagger only; the
  // inner button is the layoutId morph surface. The layoutId element MUST
  // NOT also be the list-variant element — FM's shared-layout projection
  // wants a stable source rect, and the list variant's y/opacity were
  // polluting that capture.
  const isMorphing = Boolean(cardLayoutId)
  return (
    <fmotion.div variants={listItemVariants} className="w-full">
      <fmotion.button
        type="button"
        onClick={onClick}
        layoutId={cardLayoutId}
        whileTap={disablePress ? undefined : pressCardStandard}
        transition={isMorphing ? MORPH_TRANSITION : pressTransition}
        style={{
          ...(isMorphing ? { borderRadius: 16 } : undefined),
          visibility: hideSourceVisual ? 'hidden' : 'visible',
        }}
        className={`w-full text-left bg-[var(--color-grey-light)] px-[17.413px] py-[12.438px] flex gap-[9.95px] items-center shadow-[0_7.843px_24.508px_rgba(64,64,64,0.1)] overflow-hidden ${isMorphing ? '' : 'rounded-2xl'}`}
      >
        <fmotion.img
          layoutId={imageLayoutId}
          transition={imageLayoutId ? MORPH_TRANSITION : undefined}
          src={image}
          alt=""
          className="w-[83.582px] h-[57.214px] rounded-lg object-cover shrink-0"
        />
        {/* Source-only content (title, badge, date/venue). Opacity-only fade
            tied to suppressContent so the text never visually deforms while
            the shared layoutId container is mid-transform. Image lives outside
            this wrapper because it's the morph's shared element. */}
        <fmotion.div
          animate={{ opacity: suppressContent ? 0 : 1 }}
          transition={SUPPRESS_TRANSITION}
          className="flex-1 min-w-0"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="font-extrabold text-[var(--color-orange-normal)] text-[17px] leading-none truncate">
              {title}
            </p>
            <Badge count={badgeCount} />
          </div>
          <p className="mt-[10px] text-[var(--color-grey-darker)] text-[9px] leading-tight">
            <span className="font-semibold">{date}</span>
            <br />
            <span>{venue} • {location}</span>
          </p>
        </fmotion.div>
      </fmotion.button>
    </fmotion.div>
  )
}

function FullbleedCard({ image, title, date, venue, location, onClick, cardLayoutId, imageLayoutId, suppressContent = false, disablePress = false, hideSourceVisual = false }: CommonProps) {
  // Same two-layer split as CompactCard: outer wrapper for list stagger,
  // inner button for the layoutId morph.
  const isMorphing = Boolean(cardLayoutId)
  return (
    <fmotion.div variants={listItemVariants} className="w-full">
      <fmotion.button
        type="button"
        onClick={onClick}
        layoutId={cardLayoutId}
        whileTap={disablePress ? undefined : pressCardStandard}
        transition={isMorphing ? MORPH_TRANSITION : pressTransition}
        style={{
          ...(isMorphing ? { borderRadius: 16 } : undefined),
          visibility: hideSourceVisual ? 'hidden' : 'visible',
        }}
        className={`relative w-full text-left overflow-hidden shadow-[0_7.882px_24.631px_0_rgba(83,89,144,0.07)] ${isMorphing ? '' : 'rounded-2xl'}`}
      >
        <fmotion.img
          layoutId={imageLayoutId}
          transition={imageLayoutId ? MORPH_TRANSITION : undefined}
          src={image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        {/* Source-only overlay (gradient + title + date/venue) fades out via
            suppressContent. Wrapper is `relative` so its text contributes to
            the button's height — the image stays full-bleed via absolute. */}
        <fmotion.div
          animate={{ opacity: suppressContent ? 0 : 1 }}
          transition={SUPPRESS_TRANSITION}
          className="relative z-[1]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent z-[1]" />
          <div className="relative z-10 px-[17.5px] py-[12.5px] flex flex-col items-start gap-[25px]">
            <p
              className="font-extrabold text-[var(--color-orange-light-hover)] text-[17.5px] leading-none"
              style={{ textShadow: '0 0 6px rgba(0,0,0,0.75)' }}
            >
              {title}
            </p>
            <p
              className="text-[9.27px] leading-tight text-[var(--color-orange-light-active)]"
              style={{ textShadow: '0 0 6px rgba(0,0,0,0.75)' }}
            >
              <span className="font-semibold">{date}</span>
              <br />
              <span>{venue} • {location}</span>
            </p>
          </div>
        </fmotion.div>
      </fmotion.button>
    </fmotion.div>
  )
}
