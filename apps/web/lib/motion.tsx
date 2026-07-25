'use client'

import { motion, useReducedMotion, type Variants, type HTMLMotionProps } from 'framer-motion'
import { type Direction } from '@/hooks/useDirection'

// ── Variants ────────────────────────────────────────────────────────────────

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1 },
}

export function slideFromStartVariants(dir: Direction): Variants {
  return {
    hidden: { opacity: 0, x: dir === 'rtl' ? 24 : -24 },
    visible: { opacity: 1, x: 0 },
  }
}

export function slideFromEndVariants(dir: Direction): Variants {
  return {
    hidden: { opacity: 0, x: dir === 'rtl' ? -24 : 24 },
    visible: { opacity: 1, x: 0 },
  }
}

// ── Transition presets ──────────────────────────────────────────────────────

export const transition = {
  fade: { duration: 0.4, ease: 'easeOut' as const },
  fadeUp: { duration: 0.5, ease: 'easeOut' as const },
  stagger: (i: number) => ({ delay: i * 0.1, duration: 0.4, ease: 'easeOut' as const }),
}

// ── Wrapper: reduced-motion aware ───────────────────────────────────────────

/**
 * Motion wrapper that respects prefers-reduced-motion.
 * When reduced motion is preferred, strips all transforms and uses only opacity.
 */
export function ReducedMotion({
  children,
  className,
  ...props
}: HTMLMotionProps<'div'> & { children: React.ReactNode }) {
  const prefersReduced = useReducedMotion()

  if (prefersReduced) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div className={className} {...props}>
      {children}
    </motion.div>
  )
}
