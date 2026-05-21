import type { Variants, Transition } from 'framer-motion'
import { motion as motionTokens } from './tokens'

/**
 * MOTION SYSTEM PRINCIPLES
 *
 * 1. NO DELAYED FEEDBACK — Tap response must be immediate. Never gate visual state on async.
 * 2. ONE DOMINANT MOTION — Avoid simultaneous large motions. Stagger or let one settle first.
 * 3. SELECTION IS IMMEDIATE — State changes fire synchronously in the handler, not in setTimeout/useEffect.
 * 4. PREMIUM = RESTRAINT — Fewer, slower transitions feel more expensive. Default to silence.
 * 5. EASE-OUT ALWAYS — for visible UI. Spring curve only for containers.
 */

export const pageVariants: Variants = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
}
export const pageTransition: Transition = {
  duration: motionTokens.duration.container / 1000,
  ease: motionTokens.easing.spring,
}

export const revealVariants: Variants = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
}
export const revealTransition: Transition = {
  duration: motionTokens.duration.reveal / 1000,
  ease: motionTokens.easing.out,
}

export const listVariants: Variants = {
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
}
export const listItemVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTokens.duration.reveal / 1000,
      ease: motionTokens.easing.out,
    },
  },
}

export const pressButton = { scale: motionTokens.press.button }
export const pressCardStandard = { scale: motionTokens.press.cardStandard }
export const pressCardSelected = { scale: motionTokens.press.cardSelected }
export const pressListItem = { scale: motionTokens.press.listItem, opacity: 0.9 }
export const pressTransition: Transition = {
  duration: motionTokens.duration.tap / 1000,
  ease: motionTokens.easing.out,
}
