import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, MoreVertical, Pencil, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, LayoutGroup, motion as fmotion } from 'framer-motion'
import EventCard from '../components/EventCard'
import EventMorphOverlay from '../components/EventMorphOverlay'
import { listVariants, pressButton, pressTransition } from '../motion/variants'
import { PERFIL_RAYE_MORPH_IDS } from '../motion/eventMorphIds'
import avatar from '../assets/perfil/avatar-quinn.png'
// Use the same hero asset for the RAYE thumbnail so the source and
// destination of the morph share identical image data — no swap mid-morph.
import eventRaye from '../assets/evento/hero-raye.png'
import eventLuan from '../assets/perfil/event-luan-santana.png'

type SelectedEvent = 'raye' | null

function Header() {
  const navigate = useNavigate()
  return (
    <header className="flex items-center justify-between px-[18px] pt-[8px]">
      <fmotion.button
        type="button"
        aria-label="Voltar"
        onClick={() => navigate(-1)}
        whileTap={pressButton}
        transition={pressTransition}
        className="h-10 w-10 flex items-center justify-center text-[var(--color-grey-darker)]"
      >
        <ArrowLeft size={22} strokeWidth={2} />
      </fmotion.button>
      <fmotion.button
        type="button"
        aria-label="Mais opções"
        whileTap={pressButton}
        transition={pressTransition}
        className="h-10 w-10 flex items-center justify-center text-[var(--color-grey-darker)]"
      >
        <MoreVertical size={22} strokeWidth={2} />
      </fmotion.button>
    </header>
  )
}

function ProfileBlock() {
  return (
    <section className="mt-2 flex flex-col items-center">
      <img src={avatar} alt="Quinn Fabray" className="w-[94px] h-[94px] rounded-full object-cover" />
      <h1 className="mt-4 text-[var(--color-grey-darker)] text-[23.5px] font-medium">Quinn Fabray</h1>
      <div className="mt-1 flex items-center gap-6">
        <div className="flex flex-col items-center">
          <span className="text-[var(--color-grey-darker)] text-[15.7px] font-extrabold leading-tight">350</span>
          <span className="text-[var(--color-grey-dark-active)] text-[13.7px]">Seguindo</span>
        </div>
        <div className="w-px h-[31px] bg-[var(--color-grey-light-active)]" />
        <div className="flex flex-col items-center">
          <span className="text-[var(--color-grey-darker)] text-[15.7px] font-extrabold leading-tight">346</span>
          <span className="text-[var(--color-grey-dark-active)] text-[13.7px]">Seguidores</span>
        </div>
      </div>
    </section>
  )
}

function ActionButtons() {
  return (
    <div className="mt-5 px-[30px] flex gap-[18px]">
      <fmotion.button
        type="button"
        whileTap={pressButton}
        transition={pressTransition}
        className="bg-[var(--color-pink-normal)] text-[var(--color-grey-light)] rounded-[10px] px-[17px] py-[12px] flex items-center justify-center gap-[5px] w-[125px]"
      >
        <Pencil size={17} strokeWidth={2} />
        <span className="text-[15.7px]">Editar</span>
      </fmotion.button>
      <fmotion.button
        type="button"
        whileTap={pressButton}
        transition={pressTransition}
        className="bg-[var(--color-pink-light)] text-[var(--color-pink-normal)] rounded-[10px] px-[17px] py-[12px] flex items-center justify-center gap-[7px] flex-1"
      >
        <MessageCircle size={17} strokeWidth={2} />
        <span className="text-[15.7px]">Mensagens</span>
      </fmotion.button>
    </div>
  )
}

type Tab = 'eventos' | 'favoritos' | 'estatisticas'

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string }[] = [
    { key: 'eventos', label: 'EVENTOS' },
    { key: 'favoritos', label: 'FAVORITOS' },
    { key: 'estatisticas', label: 'ESTATÍSTICAS' },
  ]
  return (
    <div className="mt-7 px-[17px] flex justify-center gap-[35px]">
      {tabs.map(({ key, label }) => {
        const isActive = key === active
        return (
          <fmotion.button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            whileTap={pressButton}
            transition={pressTransition}
            className="flex flex-col items-center gap-1"
          >
            <span
              className={`text-[15.7px] font-medium tracking-[0.15px] ${
                isActive ? 'text-[var(--color-pink-normal)]' : 'text-[var(--color-grey-normal)]'
              }`}
            >
              {label}
            </span>
            {isActive && <span className="h-[2.5px] w-full bg-[var(--color-pink-normal)] rounded-full" />}
          </fmotion.button>
        )
      })}
    </div>
  )
}

const events = [
  { image: eventRaye, title: 'RAYE', date: '12 de julho de 2026', venue: 'Audio Club', location: 'São Paulo', badgeCount: 1 },
  { image: eventLuan, title: 'Luan Santana', date: '08 de agosto de 2026', venue: 'Allianz Parque', location: 'São Paulo', badgeCount: 2 },
  { image: eventRaye, title: 'RAYE', date: '12 de julho de 2026', venue: 'Audio Club', location: 'São Paulo', badgeCount: 1 },
  { image: eventRaye, title: 'RAYE', date: '12 de julho de 2026', venue: 'Audio Club', location: 'São Paulo', badgeCount: 1 },
  { image: eventRaye, title: 'RAYE', date: '12 de julho de 2026', venue: 'Audio Club', location: 'São Paulo', badgeCount: 1 },
]

function EventList({
  onSelectRaye,
  onSelectOther,
  suppressRayeSourceContent,
}: {
  onSelectRaye: () => void
  onSelectOther: () => void
  suppressRayeSourceContent: boolean
}) {
  return (
    <fmotion.div
      variants={listVariants}
      initial="initial"
      animate="animate"
      className="mt-5 px-[23px] pb-[120px] flex flex-col gap-[14px]"
    >
      {events.map((e, i) => {
        const isFirstRaye = i === 0 && e.title === 'RAYE'
        return (
          <EventCard
            key={i}
            {...e}
            onClick={isFirstRaye ? onSelectRaye : onSelectOther}
            // Stable per-tab layoutIds — the source identity never changes
            // while Perfil is mounted. FM keeps a stable projection node.
            cardLayoutId={isFirstRaye ? PERFIL_RAYE_MORPH_IDS.container : undefined}
            imageLayoutId={isFirstRaye ? PERFIL_RAYE_MORPH_IDS.image : undefined}
            suppressContent={isFirstRaye && suppressRayeSourceContent}
            disablePress={isFirstRaye}
          />
        )
      })}
    </fmotion.div>
  )
}

export default function Perfil() {
  const [tab, setTab] = useState<Tab>('eventos')
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent>(null)
  // Source card hides its text during open/close so it never deforms inside
  // the shrinking morph container. Restored via a 260ms timer in closeRaye.
  const [suppressRayeSourceContent, setSuppressRayeSourceContent] = useState(false)
  const closeTimerRef = useRef<number | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
    }
  }, [])

  const openRaye = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setSuppressRayeSourceContent(true)
    setSelectedEvent('raye')
  }
  const closeRaye = () => {
    setSelectedEvent(null)
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
    }
    closeTimerRef.current = window.setTimeout(() => {
      setSuppressRayeSourceContent(false)
      closeTimerRef.current = null
    }, 260)
  }

  return (
    // The first RAYE card opens via an in-screen overlay morph (not a route
    // change), so Perfil stays mounted underneath. Other cards still
    // navigate to /evento (a regular route).
    // The screen root is `relative h-full` so EventMorphOverlay's absolute
    // inset-0 covers exactly this screen and the source card lives in the
    // same LayoutGroup subtree as the overlay (no portal across boundaries).
    <LayoutGroup id="event-raye-morph">
      <div className="relative h-full">
        <div className="pb-[20px]">
          <Header />
          <ProfileBlock />
          <ActionButtons />
          <TabBar active={tab} onChange={setTab} />
          <EventList
            onSelectRaye={openRaye}
            onSelectOther={() => navigate('/evento')}
            suppressRayeSourceContent={suppressRayeSourceContent}
          />
        </div>
        <AnimatePresence initial={false} mode="sync">
          {selectedEvent === 'raye' && (
            <EventMorphOverlay
              key="perfil-raye-overlay"
              morphIds={PERFIL_RAYE_MORPH_IDS}
              onClose={closeRaye}
            />
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  )
}
