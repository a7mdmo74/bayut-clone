'use client'

import { BadgeCheck, Search, Users } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useDirection } from '@/hooks/useDirection'
import { slideFromStartVariants, transition } from '@/lib/motion'

export function AnimatedHowItWorks() {
  const t = useTranslations('home')
  const dir = useDirection()
  const prefersReduced = useReducedMotion()

  const steps = [
    {
      icon: <Search className='h-5 w-5' />,
      title: t('steps.searchTitle'),
      body: t('steps.searchBody'),
    },
    {
      icon: <Users className='h-5 w-5' />,
      title: t('steps.agentTitle'),
      body: t('steps.agentBody'),
    },
    {
      icon: <BadgeCheck className='h-5 w-5' />,
      title: t('steps.moveTitle'),
      body: t('steps.moveBody'),
    },
  ]

  const variants = prefersReduced ? undefined : slideFromStartVariants(dir)

  return (
    <section className='mx-auto max-w-7xl px-4 py-16'>
      <h2 className='text-center text-2xl font-bold md:text-3xl'>{t('how')}</h2>
      <div className='mt-10 grid gap-6 md:grid-cols-3'>
        {steps.map((s, i) => {
          const Tag = prefersReduced ? 'div' : motion.div
          const props = prefersReduced
            ? {}
            : {
                variants,
                initial: 'hidden' as const,
                whileInView: 'visible' as const,
                viewport: { once: true, margin: '-50px' },
                transition: transition.stagger(i),
              }
          return (
            <Tag
              key={i}
              className='rounded-2xl border bg-card p-6 shadow-card'
              {...props}
            >
              <div className='grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary'>
                {s.icon}
              </div>
              <div className='mt-4 font-semibold'>
                {i + 1}. {s.title}
              </div>
              <p className='mt-2 text-sm text-muted-foreground'>{s.body}</p>
            </Tag>
          )
        })}
      </div>
    </section>
  )
}
