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

// Hero entry — Lottie wrapper reveal. 800ms ease-out with a slight scale overshoot at 60%.
// Mirrors the hero-lottie demo in motion-system.json.
export const heroVariants: Variants = {
  initial: { opacity: 0, scale: 0.7 },
  animate: {
    opacity: [0, 1, 1],
    scale: [0.7, 1.05, 1],
    transition: {
      duration: motionTokens.duration.hero / 1000,
      ease: motionTokens.easing.out,
      times: [0, 0.6, 1],
    },
  },
}

// Container morph (shared-element layoutId) transition — 500ms ease-out.
// Used by motion elements that share a layoutId across routes (e.g. card image
// morphing into hero image). NOT spring — spring would feel wobbly on an
// interactive control like a tapped card.
export const containerMorphTransition: Transition = {
  duration: motionTokens.duration.containerMorph / 1000,
  ease: motionTokens.easing.out,
}

// Content reveal that follows a container morph — 200ms ease-out, delayed
// so it lands after the morph completes its first half. Used on the
// destination page's non-morphing content.
export const morphContentRevealVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTokens.duration.reveal / 1000,
      delay: motionTokens.duration.reveal / 1000,
      ease: motionTokens.easing.out,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: motionTokens.duration.tap / 1000,
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
