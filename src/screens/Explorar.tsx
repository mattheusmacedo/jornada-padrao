import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { ArrowLeft, MoreVertical, Search, SlidersHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion as fmotion } from 'framer-motion'
import EventCard, { type EventCardSurfaceProps } from '../components/EventCard'
import EventMorphOverlay, { type MorphRect } from '../components/EventMorphOverlay'
import { usePhoneFrameChrome } from '../components/PhoneFrameChromeContext'
import { listVariants, pressButton, pressTransition } from '../motion/variants'
import raye from '../assets/evento/hero-raye.webp'
import badBunny from '../assets/explorar/bad-bunny.webp'
import titas from '../assets/explorar/titas.webp'
import deadFish from '../assets/explorar/dead-fish.webp'
import primavera from '../assets/explorar/primavera-sound.webp'
import anitta from '../assets/explorar/anitta.webp'
import spiritbox from '../assets/explorar/spiritbox.webp'
import lauraPasini from '../assets/explorar/laura-pasini.webp'

type EventItem = Omit<EventCardSurfaceProps, 'suppressShadow' | 'variant'>
type SelectedEvent = number | null

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

const events: EventItem[] = [
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
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent>(null)
  const [hiddenEventIndex, setHiddenEventIndex] = useState<number | null>(null)
  const [morphRect, setMorphRect] = useState<MorphRect | null>(null)
  const screenRootRef = useRef<HTMLDivElement | null>(null)
  const eventCardRefs = useRef<(HTMLButtonElement | null)[]>([])
  const scrollTopBeforeOpenRef = useRef<number | null>(null)
  const { setEventOverlayOpen } = usePhoneFrameChrome()

  useEffect(() => {
    return () => setEventOverlayOpen(false)
  }, [setEventOverlayOpen])

  const getScrollContainer = () => screenRootRef.current?.parentElement ?? null

  const measureEventCard = (index: number, sourceBox?: DOMRect): MorphRect | null => {
    const card = eventCardRefs.current[index]
    const root = screenRootRef.current
    if (!card || !root) return null
    const cardBox = sourceBox ?? card.getBoundingClientRect()
    const rootBox = root.getBoundingClientRect()
    const frameBox = root.closest('.phone-frame')?.getBoundingClientRect() ?? rootBox
    return {
      x: cardBox.left - rootBox.left,
      y: cardBox.top - rootBox.top,
      width: cardBox.width,
      height: cardBox.height,
      targetX: frameBox.left - rootBox.left,
      targetY: frameBox.top - rootBox.top,
      targetWidth: frameBox.width,
      targetHeight: frameBox.height,
    }
  }

  const openEvent = (index: number) => {
    const card = eventCardRefs.current[index]
    const root = screenRootRef.current
    if (!card || !root) return

    const sourceBox = card.getBoundingClientRect()
    scrollTopBeforeOpenRef.current = getScrollContainer()?.scrollTop ?? null

    // Release PhoneFrame chrome (bottom-inset = 0) BEFORE
    // measuring. flushSync forces React to commit the chrome release in the
    // same tick so getBoundingClientRect() sees the final full-height root,
    // not the old root that still reserves the BottomNav area. Otherwise
    // targetHeight is short by ~108px and the close FLIP lands wrong.
    flushSync(() => {
      setEventOverlayOpen(true)
    })

    const rect = measureEventCard(index, sourceBox)
    if (!rect) {
      setEventOverlayOpen(false)
      return
    }

    setMorphRect(rect)
    setHiddenEventIndex(index)
    setSelectedEvent(index)
  }
  const closeEvent = () => {
    // The overlay renders its own source-card face during exit, so the
    // real source can stay hidden until unmount. The nav is already
    // sitting underneath, so chrome + visibility restore both happen in
    // onExitComplete — no early nav return needed.
    setSelectedEvent(null)
  }

  return (
    <div ref={screenRootRef} className="relative h-full bg-white">
      <div className="pb-[20px]">
        <Header />
        <SearchBar />
        <fmotion.div
          variants={listVariants}
          initial="initial"
          animate="animate"
          className="mt-5 px-[23px] pb-[120px] flex flex-col gap-[14px]"
        >
          {events.map((e, i) => (
            <EventCard
              key={i}
              ref={(node) => {
                eventCardRefs.current[i] = node
              }}
              variant="fullbleed"
              {...e}
              onClick={() => openEvent(i)}
              hideSourceVisual={hiddenEventIndex === i}
              disablePress
            />
          ))}
        </fmotion.div>
      </div>
      <AnimatePresence
        initial={false}
        mode="sync"
        onExitComplete={() => {
          flushSync(() => {
            setEventOverlayOpen(false)
          })

          const scrollTop = scrollTopBeforeOpenRef.current
          const scrollContainer = getScrollContainer()
          if (scrollContainer && scrollTop !== null) {
            scrollContainer.scrollTop = scrollTop
          }
          scrollTopBeforeOpenRef.current = null
          setHiddenEventIndex(null)
          setMorphRect(null)
        }}
      >
        {selectedEvent !== null && morphRect && (
          <EventMorphOverlay
            key={`explorar-event-overlay-${selectedEvent}`}
            sourceRect={morphRect}
            sourceCard={{
              variant: 'fullbleed',
              ...events[selectedEvent],
            }}
            onClose={closeEvent}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
