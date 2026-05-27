import { ArrowLeft, Bookmark, Calendar, MapPin, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion as fmotion } from 'framer-motion'
import {
  containerMorphTransition,
  morphContentRevealVariants,
  pressButton,
  pressTransition,
  revealVariants,
  revealTransition,
} from '../motion/variants'
import { RAYE_EVENT_LAYOUT_ID } from './Perfil'
import hero from '../assets/evento/hero-raye.png'
import avatar1 from '../assets/evento/avatar-1.png'
import avatar2 from '../assets/evento/avatar-2.png'
import avatar3 from '../assets/evento/avatar-3.png'
import ticketmaster from '../assets/evento/ticketmaster.png'

function HeroImage() {
  const navigate = useNavigate()
  return (
    <div className="relative h-[300px] w-full shrink-0 -mt-[44px]">
      {/* Hero image rides along inside the morphing container. `layout`
          (not layoutId) lets FM animate this image's box within the parent
          morph — it doesn't need its own cross-route shared element. */}
      <fmotion.img
        layout
        transition={containerMorphTransition}
        src={hero}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-x-0 top-0 h-[120px] bg-gradient-to-b from-black/60 to-transparent" />

      <div className="relative flex items-center gap-3 px-[18px] pt-[52px]">
        <fmotion.button
          type="button"
          aria-label="Voltar"
          onClick={() => navigate(-1)}
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
      </div>
    </div>
  )
}

function FansPill() {
  return (
    <fmotion.div
      variants={revealVariants}
      initial="initial"
      animate="animate"
      transition={revealTransition}
      className="mx-auto -mt-[30px] w-[328px] h-[60px] bg-white rounded-[15px] shadow-[0_19.7px_9.8px_rgba(90,90,90,0.1)] flex items-center px-[14px] gap-[13.5px] relative z-10 shrink-0"
    >
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
    </fmotion.div>
  )
}

function EventTitle() {
  return (
    <fmotion.h2
      layout
      transition={containerMorphTransition}
      className="mt-[16px] px-[24px] text-[var(--color-typography-title)] text-[34.5px] font-extrabold leading-none shrink-0"
    >
      RAYE
    </fmotion.h2>
  )
}

function InfoIcon({ children, bg }: { children: React.ReactNode; bg: string }) {
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
  icon: React.ReactNode
  iconBg: string
  title: string
  subtitle: string
  trailing?: React.ReactNode
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

function InfoRows() {
  return (
    <div className="mt-6 flex flex-col gap-[16px] shrink-0">
      <InfoRow
        icon={<Calendar size={22} strokeWidth={2} className="text-[var(--color-pink-normal)]" />}
        iconBg="var(--color-pink-light)"
        title="12 de julho de 2026"
        subtitle="Domingo, 20:00"
      />
      <InfoRow
        icon={<MapPin size={22} strokeWidth={2} className="text-[var(--color-pink-normal)]" />}
        iconBg="var(--color-pink-light)"
        title="Audio Club"
        subtitle="Av. Francisco Matarazzo, 694 - Água Branca, São Paulo - SP"
      />
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
    </div>
  )
}

function AboutBlock() {
  return (
    <div className="mt-6 px-[20px] shrink-0">
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

function CTAButton() {
  const navigate = useNavigate()
  return (
    <fmotion.button
      type="button"
      onClick={() => navigate('/ramificacao')}
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

export default function Evento() {
  return (
    // Single layoutId on the page root: this entire screen IS the destination
    // of the Perfil RAYE card morph. Framer Motion interpolates the box from
    // card (~320×80) to page (full viewport) over 500ms ease-out. The hero
    // image and title inside use the `layout` prop to ride along; the rest of
    // the destination content reveals via morphContentRevealVariants delayed
    // until after the morph settles.
    <fmotion.div
      layoutId={RAYE_EVENT_LAYOUT_ID}
      transition={containerMorphTransition}
      className="h-full flex flex-col bg-white"
    >
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <HeroImage />
          {/* Non-morphing content fades + slides up with a 200ms delay so it
              lands after the shared-element morph has finished its first half.
              Split into two wrappers because EventTitle (morph target) sits
              between FansPill and InfoRows in the DOM order. */}
          <fmotion.div
            variants={morphContentRevealVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <FansPill />
          </fmotion.div>
          <EventTitle />
          <fmotion.div
            variants={morphContentRevealVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <InfoRows />
            <AboutBlock />
            <div className="h-[20px]" />
          </fmotion.div>
        </div>
        <fmotion.div
          variants={morphContentRevealVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative shrink-0 pb-[20px] pt-[20px] flex justify-center bg-white"
        >
          <div className="pointer-events-none absolute -top-[40px] inset-x-0 h-[40px] bg-gradient-to-t from-white to-transparent" />
          <CTAButton />
        </fmotion.div>
    </fmotion.div>
  )
}
