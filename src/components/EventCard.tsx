import { forwardRef } from 'react'
import { Ticket } from 'lucide-react'
import { motion as fmotion } from 'framer-motion'
import {
  listItemVariants,
  pressCardStandard,
  pressTransition,
} from '../motion/variants'

export type EventCardSurfaceProps = {
  variant?: 'compact' | 'fullbleed'
  image: string
  title: string
  date: string
  venue: string
  location: string
  badgeCount?: number
}

type EventCardProps = EventCardSurfaceProps & {
  onClick?: () => void
  /** Visually hides the inner button while keeping its layout box in flow.
   *  Used during the morph so only the overlay-rendered card face is
   *  visible. `visibility: hidden` keeps the rect measurable. */
  hideSourceVisual?: boolean
  /** Disables press-scale on morph-source cards so a press in flight at
   *  the moment of measure doesn't capture a scaled rect. */
  disablePress?: boolean
}

// forwardRef so the parent screen can measure the actual button rect for the
// FLIP morph. The ref always points at the inner <button>, regardless of variant.
const EventCard = forwardRef<HTMLButtonElement, EventCardProps>(function EventCard(
  { onClick, hideSourceVisual = false, disablePress = false, variant, ...surface },
  ref,
) {
  return (
    <fmotion.div variants={listItemVariants} className="w-full">
      <fmotion.button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        whileTap={disablePress ? undefined : pressCardStandard}
        transition={pressTransition}
        style={{ visibility: hideSourceVisual ? 'hidden' : 'visible' }}
        className="block w-full text-left"
      >
        <EventCardSurface variant={variant} {...surface} />
      </fmotion.button>
    </fmotion.div>
  )
})

export default EventCard

function Badge({ count }: { count: number }) {
  return (
    <span className="bg-[var(--color-orange-normal)] text-[var(--color-orange-light)] text-[11px] rounded-[5px] px-[5px] py-[2px] flex items-center gap-[3px] shrink-0">
      <Ticket size={11} strokeWidth={2.5} />
      {count}
    </span>
  )
}

/**
 * Pure visual surface — no interactivity, no motion wrappers. Used in two
 * places: inside EventCard for list rendering, and inside EventMorphOverlay
 * as the morph's "source face" so the shrinking shell already looks like
 * the real card at the final frame.
 */
export function EventCardSurface(props: EventCardSurfaceProps) {
  return props.variant === 'fullbleed'
    ? <FullbleedSurface {...props} />
    : <CompactSurface {...props} />
}

function CompactSurface({ image, title, date, venue, location, badgeCount = 1 }: EventCardSurfaceProps) {
  return (
    <div className="w-full h-full bg-[var(--color-grey-light)] px-[17.413px] py-[12.438px] flex gap-[9.95px] items-center shadow-[0_7.843px_24.508px_rgba(64,64,64,0.1)] overflow-hidden rounded-2xl">
      <img
        src={image}
        alt=""
        className="w-[83.582px] h-[57.214px] rounded-lg object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
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
      </div>
    </div>
  )
}

function FullbleedSurface({ image, title, date, venue, location }: EventCardSurfaceProps) {
  return (
    <div className="relative w-full h-full overflow-hidden shadow-[0_7.882px_24.631px_0_rgba(83,89,144,0.07)] rounded-2xl">
      <img
        src={image}
        alt=""
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      <div className="relative z-[1]">
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
      </div>
    </div>
  )
}
