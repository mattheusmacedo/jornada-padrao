import { Ticket } from 'lucide-react'
import { motion as fmotion } from 'framer-motion'
import {
  listItemVariants,
  pressCardStandard,
  pressTransition,
} from '../motion/variants'

const MORPH_TRANSITION = { type: 'spring', stiffness: 200, damping: 24 } as const

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
   *  reveals separately via the stagger group on the overlay. */
  cardLayoutId?: string
  imageLayoutId?: string
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

function CompactCard({ image, title, date, venue, location, badgeCount = 1, onClick, cardLayoutId, imageLayoutId }: CommonProps) {
  const isMorphing = Boolean(cardLayoutId)
  return (
    <fmotion.button
      type="button"
      onClick={onClick}
      layoutId={cardLayoutId}
      // No listItemVariants stagger and no whileTap on the morph trigger:
      // FM must capture this card at its rest layout — any transform
      // (entrance y:32→0 or pressed scale 0.985) at capture time pollutes
      // the source measurement and produces a visible dip in the morph.
      variants={isMorphing ? undefined : listItemVariants}
      whileTap={isMorphing ? undefined : pressCardStandard}
      transition={isMorphing ? MORPH_TRANSITION : pressTransition}
      style={isMorphing ? { borderRadius: 16 } : undefined}
      className={`w-full text-left bg-[var(--color-grey-light)] px-[17.413px] py-[12.438px] flex gap-[9.95px] items-center shadow-[0_7.843px_24.508px_rgba(64,64,64,0.1)] overflow-hidden ${isMorphing ? '' : 'rounded-2xl'}`}
    >
      <fmotion.img
        layoutId={imageLayoutId}
        transition={imageLayoutId ? MORPH_TRANSITION : undefined}
        src={image}
        alt=""
        className="w-[83.582px] h-[57.214px] rounded-lg object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          {/* Title is plain text: it disappears with the source card on morph
              rather than morphing into the large detail title. The destination
              title reveals separately via the stagger group. */}
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
    </fmotion.button>
  )
}

function FullbleedCard({ image, title, date, venue, location, onClick }: CommonProps) {
  return (
    <fmotion.button
      type="button"
      onClick={onClick}
      variants={listItemVariants}
      whileTap={pressCardStandard}
      transition={pressTransition}
      className="relative w-full text-left rounded-2xl overflow-hidden shadow-[0_7.882px_24.631px_0_rgba(83,89,144,0.07)]"
    >
      <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover z-0" />
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
    </fmotion.button>
  )
}
