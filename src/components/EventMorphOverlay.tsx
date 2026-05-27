import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion as fmotion } from 'framer-motion'
import { ArrowLeft, Bookmark, Calendar, MapPin, ArrowRight } from 'lucide-react'
import { pressButton, pressTransition } from '../motion/variants'
import { RAYE_MORPH_IDS } from '../motion/eventMorphIds'
import eventRaye from '../assets/perfil/event-raye.png'
import avatar1 from '../assets/evento/avatar-1.png'
import avatar2 from '../assets/evento/avatar-2.png'
import avatar3 from '../assets/evento/avatar-3.png'
import ticketmaster from '../assets/evento/ticketmaster.png'

type Props = { onClose: () => void }

const MORPH_TRANSITION = { type: 'spring', stiffness: 200, damping: 24 } as const
const CONTENT_REVEAL = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, transition: { duration: 0.12 } },
  transition: { delay: 0.25, duration: 0.2, ease: [0, 0, 0.2, 1] as const },
}

/**
 * The RAYE event detail rendered as a Motion-Primitives-style overlay launched
 * from Perfil. Three shared layoutIds (container, image, title) morph the
 * trigger card from its position in the Perfil list into a full-screen detail
 * surface. Renders via portal to `document.body` so it stacks above the
 * PhoneFrame chrome (BottomNav, StatusBar) without touching the route.
 */
export default function EventMorphOverlay({ onClose }: Props) {
  const navigate = useNavigate()

  return createPortal(
    <>
      {/* Scrim — soft white wash over Perfil during the morph. */}
      <fmotion.div
        className="fixed inset-0 z-30 bg-white/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* Layer that hosts the morphing container. pointer-events-none on the
          outer so the morphing card itself is the only clickable element. */}
      <div className="fixed inset-0 z-40 pointer-events-none flex">
        <fmotion.div
          layoutId={RAYE_MORPH_IDS.container}
          transition={MORPH_TRANSITION}
          style={{ borderRadius: 0 }}
          className="pointer-events-auto h-full w-full overflow-hidden bg-white flex flex-col"
        >
          {/* Hero block — image rides along with its own shared layoutId so it
              morphs from card thumb to hero, plus an overlay back button and
              bookmark anchored at the top of the hero. */}
          <div className="relative h-[300px] w-full shrink-0">
            <fmotion.img
              layoutId={RAYE_MORPH_IDS.image}
              transition={MORPH_TRANSITION}
              src={eventRaye}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 top-0 h-[120px] bg-gradient-to-b from-black/60 to-transparent" />
            <div className="relative flex items-center gap-3 px-[18px] pt-[52px]">
              <fmotion.button
                type="button"
                aria-label="Voltar"
                onClick={onClose}
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

          {/* Scrollable body — keeps the destination content contained inside
              the expanding box, never overflows the morphing container. */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <fmotion.div
              initial={CONTENT_REVEAL.initial}
              animate={CONTENT_REVEAL.animate}
              exit={CONTENT_REVEAL.exit}
              transition={CONTENT_REVEAL.transition}
              className="mx-auto -mt-[30px] w-[328px] h-[60px] bg-white rounded-[15px] shadow-[0_19.7px_9.8px_rgba(90,90,90,0.1)] flex items-center px-[14px] gap-[13.5px] relative z-10"
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

            <fmotion.h2
              layoutId={RAYE_MORPH_IDS.title}
              transition={MORPH_TRANSITION}
              className="mt-[16px] px-[24px] text-[var(--color-typography-title)] text-[34.5px] font-extrabold leading-none"
            >
              RAYE
            </fmotion.h2>

            <fmotion.div
              initial={CONTENT_REVEAL.initial}
              animate={CONTENT_REVEAL.animate}
              exit={CONTENT_REVEAL.exit}
              transition={CONTENT_REVEAL.transition}
              className="mt-6 flex flex-col gap-[16px]"
            >
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
            </fmotion.div>

            <fmotion.div
              initial={CONTENT_REVEAL.initial}
              animate={CONTENT_REVEAL.animate}
              exit={CONTENT_REVEAL.exit}
              transition={CONTENT_REVEAL.transition}
              className="mt-6 px-[20px]"
            >
              <h3 className="text-[var(--color-grey-darker)] text-[17.7px] font-medium">Sobre o evento</h3>
              <p className="mt-3 text-[15.8px] leading-[27px] text-[var(--color-grey-darker)]">
                Raye, artista britânica de 28 anos, fã de bossa nova, principalmente de João Gilberto, desembarca no Brasil este mês para uma apresentação única.{' '}
                <span className="text-[var(--color-orange-normal)]">Leia mais...</span>
              </p>
              <div className="h-[40px]" />
            </fmotion.div>
          </div>

          <fmotion.div
            initial={CONTENT_REVEAL.initial}
            animate={CONTENT_REVEAL.animate}
            exit={CONTENT_REVEAL.exit}
            transition={CONTENT_REVEAL.transition}
            className="relative shrink-0 pb-[20px] pt-[20px] flex justify-center bg-white"
          >
            <div className="pointer-events-none absolute -top-[40px] inset-x-0 h-[40px] bg-gradient-to-t from-white to-transparent" />
            <fmotion.button
              type="button"
              onClick={() => {
                onClose()
                navigate('/ramificacao')
              }}
              whileTap={pressButton}
              transition={pressTransition}
              className="bg-[var(--color-orange-normal)] text-white rounded-[15px] h-[57px] flex items-center justify-center gap-3 px-[31px] tracking-[1px]"
            >
              <span className="text-[15.8px] font-medium uppercase">Adicionar à</span>
              <span className="w-[30px] h-[30px] rounded-full bg-[var(--color-orange-dark)] flex items-center justify-center">
                <ArrowRight size={16} strokeWidth={2.5} className="text-white" />
              </span>
            </fmotion.button>
          </fmotion.div>
        </fmotion.div>
      </div>
    </>,
    document.body
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
      <div className="w-[47px] h-[47px] rounded-[12px] flex items-center justify-center shrink-0" style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[var(--color-grey-darker)] text-[15.8px] font-medium leading-tight">{title}</p>
        <p className="mt-[2px] text-[var(--color-grey-dark)] text-[11.8px] leading-tight">{subtitle}</p>
      </div>
      {trailing}
    </div>
  )
}
