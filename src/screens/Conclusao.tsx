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

        {/* Beat 1: illustration enters at t=0 with hero variants and loops continuously */}
        <fmotion.div
          variants={heroVariants}
          initial="initial"
          animate="animate"
          className="w-[380px] h-[302px]"
        >
          <ConclusaoIllustration />
        </fmotion.div>

        {/* Beat 2: title enters in parallel with the illustration at t=0 — same heroVariants */}
        <fmotion.h1
          variants={heroVariants}
          initial="initial"
          animate="animate"
          className="mt-[32px] w-[280px] text-center text-white font-bold uppercase text-[22.8px] leading-tight no-underline"
          style={{ letterSpacing: '1.42px', textDecoration: 'none' }}
        >
          Evento adicionado ao seu perfil!
        </fmotion.h1>
      </div>
    </PageTransition>
  )
}
