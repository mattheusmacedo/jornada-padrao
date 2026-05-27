import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, MoreVertical, Search, SlidersHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, LayoutGroup, motion as fmotion } from 'framer-motion'
import EventCard from '../components/EventCard'
import EventMorphOverlay from '../components/EventMorphOverlay'
import { listVariants, pressButton, pressTransition } from '../motion/variants'
import { createEventMorphIds, EXPLORAR_RAYE_MORPH_IDS } from '../motion/eventMorphIds'
// Use the same hero asset for the RAYE source thumbnail so the morph's
// source and destination share identical image data — no swap mid-morph.
import raye from '../assets/evento/hero-raye.png'
import badBunny from '../assets/explorar/bad-bunny.png'
import titas from '../assets/explorar/titas.png'
import deadFish from '../assets/explorar/dead-fish.png'
import primavera from '../assets/explorar/primavera-sound.png'
import anitta from '../assets/explorar/anitta.png'
import spiritbox from '../assets/explorar/spiritbox.png'
import lauraPasini from '../assets/explorar/laura-pasini.png'

type SelectedEvent = 'raye' | null

function Header() {
  const navigate = useNavigate()
  return (
    <header className="flex items-center gap-3 px-[18px] pt-[8px]">
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
      <h1 className="flex-1 text-[var(--color-grey-darker)] text-[23.6px] font-medium leading-none">
        Explorar
      </h1>
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

function SearchBar() {
  return (
    <div className="mt-5 px-[23px] flex items-center gap-3">
      <div className="flex-1 flex items-center gap-3">
        <Search size={24} className="text-[var(--color-pink-normal)]" strokeWidth={2} />
        <div className="w-px h-[26px] bg-[var(--color-grey-light-active)]" />
        <span className="text-black/30 text-[18px] font-light">Pesquisar...</span>
      </div>
      <fmotion.button
        type="button"
        whileTap={pressButton}
        transition={pressTransition}
        className="bg-[var(--color-pink-normal)] text-[var(--color-pink-light-hover)] rounded-full px-[12px] py-[6px] flex items-center gap-[6px] text-[11.8px]"
      >
        <SlidersHorizontal size={14} strokeWidth={2} />
        Filtros
      </fmotion.button>
    </div>
  )
}

const events = [
  { image: raye, title: 'RAYE', date: '12 de julho de 2026', venue: 'Audio Club', location: 'São Paulo' },
  { image: badBunny, title: 'Bad Bunny', date: '12 de outubro de 2026', venue: 'MorumBIS', location: 'São Paulo' },
  { image: titas, title: 'Titãs', date: '15 de outubro de 2026', venue: 'BeFly Hall', location: 'Belo Horizonte' },
  { image: deadFish, title: 'Dead Fish', date: '02 de novembro de 2026', venue: 'Fradique Club', location: 'São Paulo' },
  { image: primavera, title: 'Primavera Sound', date: '05 e 06 de dezembro de 2026', venue: 'Autódromo de Interlagos', location: 'São Paulo' },
  { image: anitta, title: 'Ensaios da Anitta', date: '02 de fevereiro de 2027', venue: 'Pedreira Paulo Leminski', location: 'Curitiba' },
  { image: spiritbox, title: 'Spiritbox', date: '23 de fevereiro de 2027', venue: 'Jai Club', location: 'São Paulo' },
  { image: lauraPasini, title: 'Laura Pasini', date: '27 de fevereiro de 2027', venue: 'Mercado Livre Arena Pacaembu', location: 'São Paulo' },
]

export default function Explorar() {
  const navigate = useNavigate()
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent>(null)
  // morphArmed: "list has settled, morph IDs are safe to attach now."
  // Stays armed forever after the entrance completes — never disarmed on
  // overlay close, otherwise the second open loses the card-to-page
  // expansion because FM has no source projection registered.
  const [suppressRayeSourceContent, setSuppressRayeSourceContent] = useState(false)
  const [morphArmed, setMorphArmed] = useState(false)
  // Monotonic counter — each open→close cycle ends with a bump so the next
  // open uses fresh layoutId strings (avoids stale FM projection state).
  const [morphSession, setMorphSession] = useState(0)
  const armTimerRef = useRef<number | null>(null)
  const closeTimerRef = useRef<number | null>(null)
  const openFrameRef = useRef<number | null>(null)
  const refreshFrameRef = useRef<number | null>(null)

  const morphIds = useMemo(
    () => createEventMorphIds(EXPLORAR_RAYE_MORPH_IDS, morphSession),
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

  // After overlay close completes, disarm → bump session → re-arm over two
  // rAFs so the source card briefly renders without a layoutId, then re-renders
  // with a fresh session-suffixed layoutId. FM gets a clean slate per open.
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

    // Fallback: very early tap. Attach the layoutId now, wait two animation
    // frames so FM commits the source projection, then mount the overlay.
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

  // Explorar intentionally does NOT wrap in PageTransition: the morph from
  // the RAYE card to the detail overlay needs the source's parent to be
  // transform-stable.
  return (
    // The screen root is `relative h-full` so EventMorphOverlay's absolute
    // inset-0 covers exactly this screen and the source card lives in the
    // same LayoutGroup subtree as the overlay (no portal across boundaries).
    <LayoutGroup id="explorar-raye-morph">
      <div className="relative h-full bg-white">
        <div className="pb-[20px]">
          <Header />
          <SearchBar />
          <fmotion.div
            variants={listVariants}
            initial="initial"
            animate="animate"
            className="mt-5 px-[23px] flex flex-col gap-[14px]"
          >
            {events.map((e, i) => {
              const isFirstRaye = i === 0 && e.title === 'RAYE'
              return (
                <EventCard
                  key={i}
                  variant="fullbleed"
                  {...e}
                  onClick={isFirstRaye ? openRaye : () => navigate('/evento')}
                  cardLayoutId={isFirstRaye && morphArmed ? morphIds.container : undefined}
                  imageLayoutId={isFirstRaye && morphArmed ? morphIds.image : undefined}
                  suppressContent={isFirstRaye && suppressRayeSourceContent}
                  disablePress={isFirstRaye}
                />
              )
            })}
          </fmotion.div>
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
              key={`explorar-raye-overlay-${morphSession}`}
              morphIds={morphIds}
              onClose={closeRaye}
            />
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  )
}
