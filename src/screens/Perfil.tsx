import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, MoreVertical, Pencil, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, LayoutGroup, motion as fmotion } from 'framer-motion'
import EventCard from '../components/EventCard'
import EventMorphOverlay from '../components/EventMorphOverlay'
import { listVariants, pressButton, pressTransition } from '../motion/variants'
import { createEventMorphIds, PERFIL_RAYE_MORPH_IDS } from '../motion/eventMorphIds'
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
  morphArmed,
  morphIds,
}: {
  onSelectRaye: () => void
  onSelectOther: () => void
  suppressRayeSourceContent: boolean
  morphArmed: boolean
  morphIds: { container: string; image: string }
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
            // Session-rotated layoutIds — fresh strings per open cycle so
            // FM never reuses a stale projection node.
            cardLayoutId={isFirstRaye && morphArmed ? morphIds.container : undefined}
            imageLayoutId={isFirstRaye && morphArmed ? morphIds.image : undefined}
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
  // suppressRayeSourceContent: source-only card text hides during open/close.
  // Restored via a 260ms timer in closeRaye.
  const [suppressRayeSourceContent, setSuppressRayeSourceContent] = useState(false)
  // morphArmed: "list has settled, morph IDs are safe to attach now."
  // Stays armed forever after the entrance completes — never disarmed on
  // overlay close, otherwise the second open loses the card-to-page
  // expansion because FM has no source projection registered.
  const [morphArmed, setMorphArmed] = useState(false)
  // Monotonic counter — each open→close cycle ends with a bump so the next
  // open uses fresh layoutId strings. FM treats them as new projection
  // nodes and never reuses a stale source/destination pair.
  const [morphSession, setMorphSession] = useState(0)
  const armTimerRef = useRef<number | null>(null)
  const closeTimerRef = useRef<number | null>(null)
  const openFrameRef = useRef<number | null>(null)
  const refreshFrameRef = useRef<number | null>(null)
  const navigate = useNavigate()

  const morphIds = useMemo(
    () => createEventMorphIds(PERFIL_RAYE_MORPH_IDS, morphSession),
    [morphSession]
  )

  // Mirrors listVariants timing (see motion/variants.ts).
  const LIST_DELAY_MS = 100
  const LIST_STAGGER_MS = 50
  const LIST_ITEM_MS = 200
  const MORPH_ARM_DELAY_MS =
    LIST_DELAY_MS + (events.length - 1) * LIST_STAGGER_MS + LIST_ITEM_MS + 50

  useEffect(() => {
    armTimerRef.current = window.setTimeout(() => {
      setMorphArmed(true)
      armTimerRef.current = null
    }, MORPH_ARM_DELAY_MS)
    return () => {
      if (armTimerRef.current) window.clearTimeout(armTimerRef.current)
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
      if (openFrameRef.current) window.cancelAnimationFrame(openFrameRef.current)
      if (refreshFrameRef.current) window.cancelAnimationFrame(refreshFrameRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // After the overlay's full exit animation completes, briefly disarm,
  // bump the session, and re-arm — all within two animation frames. The
  // source card briefly renders without a layoutId, then renders again
  // with a fresh layoutId tied to the new session. FM gets a clean slate
  // for the next open.
  const refreshMorphIds = () => {
    if (refreshFrameRef.current) {
      window.cancelAnimationFrame(refreshFrameRef.current)
    }
    setMorphArmed(false)
    refreshFrameRef.current = window.requestAnimationFrame(() => {
      setMorphSession((s) => s + 1)
      refreshFrameRef.current = window.requestAnimationFrame(() => {
        setMorphArmed(true)
        refreshFrameRef.current = null
      })
    })
  }

  const openRaye = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setSuppressRayeSourceContent(true)

    if (morphArmed) {
      // Common case: list has settled, layoutIds already attached → open
      // immediately. FM uses the already-registered source projection.
      setSelectedEvent('raye')
      return
    }

    // Fallback: very early tap before the arm timer fires. Attach the
    // layoutId now, wait two animation frames so FM commits the source
    // projection, then mount the overlay.
    setMorphArmed(true)
    openFrameRef.current = window.requestAnimationFrame(() => {
      openFrameRef.current = window.requestAnimationFrame(() => {
        setSelectedEvent('raye')
        openFrameRef.current = null
      })
    })
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
            morphArmed={morphArmed}
            morphIds={morphIds}
          />
        </div>
        {/* onExitComplete only refreshes layoutIds — text restoration is
            handled by the 260ms timer in closeRaye, not here. */}
        <AnimatePresence
          initial={false}
          mode="sync"
          onExitComplete={refreshMorphIds}
        >
          {selectedEvent === 'raye' && (
            <EventMorphOverlay
              key={`perfil-raye-overlay-${morphSession}`}
              morphIds={morphIds}
              onClose={closeRaye}
            />
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  )
}
