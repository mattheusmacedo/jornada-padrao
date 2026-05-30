import { useRef, useState } from 'react'
import { ArrowLeft, MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion as fmotion } from 'framer-motion'
import { PageTransition } from '../motion/transitions'
import {
  pressButton,
  pressCardStandard,
  pressCardSelected,
  pressTransition,
} from '../motion/variants'
import { motion as motionTokens } from '../motion/tokens'
import AlphaVideo from '../components/AlphaVideo'
import { pickRandom } from '../utils/random'

type Choice = 'salvos' | 'favoritos'
type PhoneVideoState = 'idle-phone' | 'idle-phone-2'
type VideoState = 'idle' | PhoneVideoState | 'idle-bands'
type VariationVideoState = Exclude<VideoState, 'idle'>

const PHONE_VARIATIONS = ['idle-phone', 'idle-phone-2'] as const

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
        Adicionar à
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

const ORANGE_LIGHT = '#FFF3E6'
const WHITE = '#FFFFFF'

const bgTransition = {
  duration: motionTokens.duration.reveal / 1000,
  ease: motionTokens.easing.out,
}

function RadioCard({
  title,
  subtitle,
  selected,
  onSelect,
}: {
  title: string
  subtitle: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <fmotion.button
      type="button"
      onClick={onSelect}
      whileTap={selected ? pressCardSelected : pressCardStandard}
      animate={{ backgroundColor: selected ? ORANGE_LIGHT : WHITE }}
      transition={bgTransition}
      className="w-full text-left rounded-[15px] h-[71px] flex items-center gap-[13.5px] px-[14px] shadow-[0_19.7px_9.8px_rgba(90,90,90,0.1)]"
    >
      <span className="w-[22px] h-[22px] rounded-full border-[2px] border-[var(--color-orange-normal)] flex items-center justify-center shrink-0">
        <fmotion.span
          className="rounded-full bg-[var(--color-orange-normal)]"
          animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
          transition={bgTransition}
          style={{ width: 12, height: 12, originX: 0.5, originY: 0.5 }}
        />
      </span>
      <div>
        <p className="text-[var(--color-grey-darker)] text-[17.5px] font-medium leading-tight">{title}</p>
        <p className="text-[#6d6d6d] text-[12.5px] leading-tight">{subtitle}</p>
      </div>
    </fmotion.button>
  )
}

export default function Ramificacao() {
  const [choice, setChoice] = useState<Choice | null>(null)
  const [currentVideo, setCurrentVideo] = useState<VideoState>('idle')
  // pendingVideo is set synchronously in the click handler and consumed at the
  // next idle boundary. After that, selectedChoiceRef keeps the chosen loop
  // running: idle -> variation -> idle -> variation...
  const pendingVideoRef = useRef<VariationVideoState | null>(null)
  const selectedChoiceRef = useRef<Choice | null>(null)
  const lastPhoneVideoRef = useRef<PhoneVideoState | null>(null)

  const navigate = useNavigate()

  const nextVariationForChoice = (next: Choice): VariationVideoState => {
    if (next === 'favoritos') return 'idle-bands'

    const nextPhone = pickRandom(PHONE_VARIATIONS, lastPhoneVideoRef.current)
    lastPhoneVideoRef.current = nextPhone
    return nextPhone
  }

  const handleSelect = (next: Choice) => {
    setChoice(next)
    selectedChoiceRef.current = next
    pendingVideoRef.current = nextVariationForChoice(next)
  }

  const handleEnded = () => {
    if (currentVideo !== 'idle') {
      setCurrentVideo('idle')
      return false
    }

    if (pendingVideoRef.current) {
      const next = pendingVideoRef.current
      pendingVideoRef.current = null
      setCurrentVideo(next)
      return false
    }

    if (selectedChoiceRef.current) {
      setCurrentVideo(nextVariationForChoice(selectedChoiceRef.current))
      return false
    }

    // No selected choice yet: keep idle looping smoothly until the first tap.
  }

  return (
    <PageTransition>
      <div className="relative h-full bg-white overflow-hidden">
        {/* Back layer: alpha-video character. pointer-events-none so it doesn't
            intercept taps on the radio cards / CONCLUIR. */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <AlphaVideo
            src={`/videos/state-machine/${currentVideo}`}
            onEnded={handleEnded}
            className="w-full h-full"
            style={{ objectFit: 'contain' }}
          />
        </div>

        {/* Foreground UI */}
        <div className="relative z-10 h-full">
          <Header />
          <div className="mt-6 px-[28px] flex flex-col gap-[13.5px]">
            <RadioCard
              title="Shows salvos"
              subtitle="Aqueles que você precisa ir"
              selected={choice === 'salvos'}
              onSelect={() => handleSelect('salvos')}
            />
            <RadioCard
              title="Shows favoritos"
              subtitle="Aqueles que mudaram sua vida"
              selected={choice === 'favoritos'}
              onSelect={() => handleSelect('favoritos')}
            />
          </div>
          <div className="absolute bottom-[24px] inset-x-0 flex justify-center">
            <fmotion.button
              type="button"
              onClick={() => navigate('/conclusao')}
              whileTap={pressButton}
              transition={pressTransition}
              className="bg-[var(--color-orange-normal)] text-white rounded-[15px] h-[57px] px-[60px] text-[15.8px] font-medium tracking-[1px] uppercase"
            >
              Concluir
            </fmotion.button>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
