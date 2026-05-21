import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion as fmotion } from 'framer-motion'
import { PageTransition } from '../motion/transitions'
import {
  pressButton,
  pressTransition,
  revealVariants,
  revealTransition,
} from '../motion/variants'

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
          className="absolute top-[8px] right-[18px] h-10 w-10 flex items-center justify-center text-white"
        >
          <X size={24} strokeWidth={2.5} />
        </fmotion.button>

        <fmotion.div
          variants={revealVariants}
          initial="initial"
          animate="animate"
          transition={revealTransition}
          className="w-[280px] h-[280px] border-2 border-dashed border-white/40 bg-white/10 rounded-3xl flex items-center justify-center"
        >
          {/* TODO: replace with Lottie JSON animation (girl with headphones) */}
          <span className="text-white/60 text-[14px] font-medium tracking-[0.5px] uppercase">Lottie</span>
        </fmotion.div>

        <fmotion.h1
          variants={revealVariants}
          initial="initial"
          animate="animate"
          transition={revealTransition}
          className="mt-[40px] w-[220px] text-center text-white font-medium uppercase text-[22.8px] leading-tight"
          style={{ letterSpacing: '1.42px' }}
        >
          Evento adicionado ao seu perfil!
        </fmotion.h1>
      </div>
    </PageTransition>
  )
}
