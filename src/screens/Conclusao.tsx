import { useState } from 'react'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion as fmotion, AnimatePresence } from 'framer-motion'
import { PageTransition } from '../motion/transitions'
import {
  heroVariants,
  pressButton,
  pressTransition,
} from '../motion/variants'
import ConclusaoIllustration from '../components/ConclusaoIllustration'

export default function Conclusao() {
  const navigate = useNavigate()
  const [showTitle, setShowTitle] = useState(false)
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

        {/* Beat 1: illustration enters with hero variants; internal Lottie plays in parallel */}
        <fmotion.div
          variants={heroVariants}
          initial="initial"
          animate="animate"
          className="w-full max-w-[493px] aspect-[493/392]"
        >
          <ConclusaoIllustration onIntroComplete={() => setShowTitle(true)} />
        </fmotion.div>

        {/* Beat 2: title reveals only after Lottie completes its full intro */}
        <AnimatePresence>
          {showTitle && (
            <fmotion.h1
              key="conclusao-title"
              variants={heroVariants}
              initial="initial"
              animate="animate"
              className="mt-[40px] w-[260px] text-center text-white font-medium uppercase text-[22.8px] leading-tight"
              style={{ letterSpacing: '1.42px' }}
            >
              Evento adicionado ao seu perfil!
            </fmotion.h1>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
