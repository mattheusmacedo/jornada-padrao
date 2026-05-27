// Shared presentational pieces for the RAYE event detail. Used in two places:
//   - src/screens/Evento.tsx        (direct /evento route)
//   - src/components/EventMorphOverlay.tsx  (in-Perfil overlay morph)
//
// Destination-only content (FansPill, the three info rows, AboutBlock, CTA)
// is plain DOM with no built-in entrance motion. Callers wrap each piece in
// motion.div + detailRevealItem so the stagger group can choreograph them
// after any morph has settled.
//
// Only EventHero's hero image and EventTitle's title text optionally take
// shared-element layoutIds — those are the true cross-route shared elements.
// The hero header controls (back/title/bookmark) have their own short
// delayed fade-in so they don't deform during a morph.

import type { ReactNode } from 'react'
import { ArrowLeft, Bookmark, Calendar, MapPin, ArrowRight } from 'lucide-react'
import { motion as fmotion } from 'framer-motion'
import { pressButton, pressTransition } from '../motion/variants'
import rayeHero from '../assets/evento/hero-raye.png'
import avatar1 from '../assets/evento/avatar-1.png'
import avatar2 from '../assets/evento/avatar-2.png'
import avatar3 from '../assets/evento/avatar-3.png'
import ticketmaster from '../assets/evento/ticketmaster.png'

export const RAYE_HERO_SRC = rayeHero

const MORPH_TRANSITION = { type: 'spring', stiffness: 200, damping: 24 } as const

// Hero header controls reveal — delayed past the first beat of any morph so
// the back/title/bookmark don't visibly distort during the container scale.
const HEADER_REVEAL_TRANSITION = {
  delay: 0.22,
  duration: 0.18,
  ease: [0, 0, 0.2, 1] as [number, number, number, number],
}

type EventHeroProps = {
  onBack: () => void
}

export function EventHero({ onBack }: EventHeroProps) {
  return (
    <div className="relative h-[300px] w-full shrink-0">
      {/* `layout` (not layoutId) — the hero participates as a layout child
          of the morphing page shell, not as a shared element with the
          source thumbnail. The source thumbnails on Perfil (compact) vs
          Explorar (fullbleed) have different geometries; bridging them
          via shared layoutId produces inconsistent morph paths across
          tabs. Letting the hero ride inside the shell gives both tabs
          the same choreography. */}
      <fmotion.img
        layout
        transition={MORPH_TRANSITION}
        src={rayeHero}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-x-0 top-0 h-[120px] bg-gradient-to-b from-black/60 to-transparent" />
      <fmotion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={HEADER_REVEAL_TRANSITION}
        className="relative flex items-center gap-3 px-[18px] pt-[52px]"
      >
        <fmotion.button
          type="button"
          aria-label="Voltar"
          onClick={onBack}
          whileTap={pressButton}
          transition={pressTransition}
          className="h-10 w-10 flex items-center justify-center text-white"
        >
          <ArrowLeft size={22} strokeWidth={2} />
        </fmotion.button>
        <h1 className="flex-1 text-white text-[20px] font-medium leading-none">
          Detalhes do evento
        </h1>
        <fmotion.button
          type="button"
          aria-label="Salvar"
          whileTap={pressButton}
          transition={pressTransition}
          className="h-10 w-10 rounded-full bg-[var(--color-orange-light)] flex items-center justify-center"
        >
          <Bookmark size={18} strokeWidth={2} className="text-[var(--color-orange-normal)]" fill="currentColor" />
        </fmotion.button>
      </fmotion.div>
    </div>
  )
}

export function FansPill() {
  return (
    <div className="mx-auto -mt-[30px] w-[328px] h-[60px] bg-white rounded-[15px] shadow-[0_19.7px_9.8px_rgba(90,90,90,0.1)] flex items-center px-[14px] gap-[13.5px] relative z-10 shrink-0">
      <div className="flex">
        <img src={avatar1} alt="" className="w-[34px] h-[34px] rounded-full ring-2 ring-white" />
        <img src={avatar2} alt="" className="w-[34px] h-[34px] rounded-full ring-2 ring-white -ml-[12px]" />
        <img src={avatar3} alt="" className="w-[34px] h-[34px] rounded-full ring-2 ring-white -ml-[12px]" />
      </div>
      <span className="text-[var(--color-pink-normal)] text-[14.8px] font-medium">+800 fãs</span>
      <fmotion.button
        type="button"
        whileTap={pressButton}
        transition={pressTransition}
        className="ml-auto bg-[var(--color-pink-normal)] text-[var(--color-grey-light)] text-[11.8px] rounded-[10px] px-[13px] py-[9px]"
      >
        Convidar amigos
      </fmotion.button>
    </div>
  )
}

type EventTitleProps = {
  titleLayoutId?: string
}

export function EventTitle({ titleLayoutId }: EventTitleProps) {
  if (titleLayoutId) {
    return (
      <fmotion.h2
        layoutId={titleLayoutId}
        transition={MORPH_TRANSITION}
        className="mt-[16px] px-[24px] text-[var(--color-typography-title)] text-[34.5px] font-extrabold leading-none shrink-0"
      >
        RAYE
      </fmotion.h2>
    )
  }
  return (
    <h2 className="mt-[16px] px-[24px] text-[var(--color-typography-title)] text-[34.5px] font-extrabold leading-none shrink-0">
      RAYE
    </h2>
  )
}

function InfoIcon({ children, bg }: { children: ReactNode; bg: string }) {
  return (
    <div className="w-[47px] h-[47px] rounded-[12px] flex items-center justify-center shrink-0" style={{ background: bg }}>
      {children}
    </div>
  )
}

function InfoRow({
  icon,
  iconBg,
  title,
  subtitle,
  trailing,
}: {
  icon: ReactNode
  iconBg: string
  title: string
  subtitle: string
  trailing?: ReactNode
}) {
  return (
    <div className="flex items-center gap-[14px] px-[20px]">
      <InfoIcon bg={iconBg}>{icon}</InfoIcon>
      <div className="flex-1 min-w-0">
        <p className="text-[var(--color-grey-darker)] text-[15.8px] font-medium leading-tight">{title}</p>
        <p className="mt-[2px] text-[var(--color-grey-dark)] text-[11.8px] leading-tight">{subtitle}</p>
      </div>
      {trailing}
    </div>
  )
}

// Individual info rows — exported so callers can wrap each in its own stagger item.
export function DateRow() {
  return (
    <InfoRow
      icon={<Calendar size={22} strokeWidth={2} className="text-[var(--color-pink-normal)]" />}
      iconBg="var(--color-pink-light)"
      title="12 de julho de 2026"
      subtitle="Domingo, 20:00"
    />
  )
}

export function VenueRow() {
  return (
    <InfoRow
      icon={<MapPin size={22} strokeWidth={2} className="text-[var(--color-pink-normal)]" />}
      iconBg="var(--color-pink-light)"
      title="Audio Club"
      subtitle="Av. Francisco Matarazzo, 694 - Água Branca, São Paulo - SP"
    />
  )
}

export function OrganizerRow() {
  return (
    <InfoRow
      icon={<img src={ticketmaster} alt="" className="w-[35px] h-[35px] rounded-[8px] object-cover" />}
      iconBg="transparent"
      title="Ticketmaster"
      subtitle="Organizador"
      trailing={
        <fmotion.button
          type="button"
          whileTap={pressButton}
          transition={pressTransition}
          className="bg-[var(--color-pink-light-hover)] text-[var(--color-pink-normal)] text-[11.8px] rounded-[7px] px-[14px] py-[6px]"
        >
          Seguir
        </fmotion.button>
      }
    />
  )
}

export function AboutBlock() {
  return (
    <div className="px-[20px] shrink-0">
      <h3 className="text-[var(--color-grey-darker)] text-[17.7px] font-medium">Sobre o evento</h3>
      <p className="mt-3 text-[15.8px] leading-[27px] text-[var(--color-grey-darker)]">
        Raye, artista britânica de 28 anos, fã de bossa nova, principalmente de João Gilberto, desembarca no Brasil este mês para uma apresentação única.{' '}
        <fmotion.button
          type="button"
          whileTap={pressButton}
          transition={pressTransition}
          className="text-[var(--color-orange-normal)] inline align-baseline"
        >
          Leia mais...
        </fmotion.button>
      </p>
    </div>
  )
}

export function CTAButton({ onClick }: { onClick: () => void }) {
  return (
    <fmotion.button
      type="button"
      onClick={onClick}
      whileTap={pressButton}
      transition={pressTransition}
      className="bg-[var(--color-orange-normal)] text-white rounded-[15px] h-[57px] flex items-center justify-center gap-3 px-[31px] tracking-[1px]"
    >
      <span className="text-[15.8px] font-medium uppercase">Adicionar à</span>
      <span className="w-[30px] h-[30px] rounded-full bg-[var(--color-orange-dark)] flex items-center justify-center">
        <ArrowRight size={16} strokeWidth={2.5} className="text-white" />
      </span>
    </fmotion.button>
  )
}

export function CTAFooter({ onClick }: { onClick: () => void }) {
  return (
    <div className="relative shrink-0 pb-[20px] pt-[20px] flex justify-center bg-white">
      <div className="pointer-events-none absolute -top-[40px] inset-x-0 h-[40px] bg-gradient-to-t from-white to-transparent" />
      <CTAButton onClick={onClick} />
    </div>
  )
}
