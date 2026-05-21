import type { ReactNode } from 'react'
import { motion as fmotion } from 'framer-motion'
import { pageVariants, pageTransition } from './variants'

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <fmotion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="h-full w-full"
    >
      {children}
    </fmotion.div>
  )
}
