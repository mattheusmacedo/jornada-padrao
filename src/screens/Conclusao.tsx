import { useState } from 'react'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion as fmotion } from 'framer-motion'
import { PageTransition } from '../motion/transitions'
import {
  heroVariants,
  pressButton,
  pressTransition,
} from '../motion/variants'
import ConclusaoIllustration from '../components/ConclusaoIllustration'

export default function Conclusao() {
  const navigate = useNavigate()
  // Both the illustration wrapper and the title gate their hero entry on the
  // Lottie's onDOMLoaded — the same "starting gun" so they fire together once
  // the first complete Lottie frame is on screen.
  const [isReady, setIsReady] = useState(false)

  return (
    <PageTransition>
      <div className="relative h-full flex flex-col items-center px-6 pt-[56px]">
        <fmotion.button
          type="button"
          aria-label="Fechar"
          onClick={() => navigate('/')}
          whileTap={pressButton}
          transition={pressTransition}
          className="absolute top-[8px] right-[18px] h-10 w-10 flex items-center justify-center text-white z-10"
        >
          <X size={24} strokeWidth={2.5} />
        </fmotion.button>

        <fmotion.div
          variants={heroVariants}
          initial="initial"
          animate={isReady ? 'animate' : 'initial'}
          className="w-[380px] h-[302px]"
        >
          <ConclusaoIllustration onReady={() => setIsReady(true)} />
        </fmotion.div>

        <fmotion.h1
          variants={heroVariants}
          initial="initial"
          animate={isReady ? 'animate' : 'initial'}
          className="mt-[32px] w-[280px] text-center text-white font-bold uppercase text-[22.8px] leading-tight no-underline"
          style={{ letterSpacing: '1.42px', textDecoration: 'none' }}
        >
          Evento<br />adicionado<br />ao seu perfil!
        </fmotion.h1>
      </div>
    </PageTransition>
  )
}
