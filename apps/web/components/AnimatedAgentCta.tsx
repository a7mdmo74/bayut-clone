'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { fadeInUp, transition } from '@/lib/motion'

export function AnimatedAgentCta() {
  const t = useTranslations('home')
  const prefersReduced = useReducedMotion()

  const Wrapper = prefersReduced ? 'div' : motion.div
  const wrapperProps = prefersReduced
    ? {}
    : {
        variants: fadeInUp,
        initial: 'hidden' as const,
        whileInView: 'visible' as const,
        viewport: { once: true, margin: '-50px' },
        transition: transition.fadeUp,
      }

  const Child = prefersReduced ? 'div' : motion.div

  return (
    <section className='mx-auto mb-16 max-w-7xl px-4'>
      <Wrapper
        className='overflow-hidden rounded-2xl bg-gradient-primary p-8 text-primary-foreground md:p-12'
        {...wrapperProps}
      >
        <div className='grid gap-8 md:grid-cols-[1.6fr_1fr] md:items-center'>
          <Child
            {...(prefersReduced
              ? {}
              : {
                  variants: fadeInUp,
                  initial: 'hidden' as const,
                  whileInView: 'visible' as const,
                  viewport: { once: true },
                  transition: transition.stagger(1),
                })}
          >
            <h3 className='text-2xl font-bold md:text-3xl'>{t('agentTitle')}</h3>
            <p className='mt-2 text-primary-foreground/85'>{t('agentDescription')}</p>
          </Child>
          <Child
            className='flex flex-wrap gap-3 md:justify-end'
            {...(prefersReduced
              ? {}
              : {
                  variants: fadeInUp,
                  initial: 'hidden' as const,
                  whileInView: 'visible' as const,
                  viewport: { once: true },
                  transition: transition.stagger(2),
                })}
          >
            <Button size='lg' variant='secondary' render={<Link href='/become-agent' />}>
              {t('becomeAgent')}
            </Button>
            <Button
              size='lg'
              variant='outline'
              className='border-white/40 bg-white/10 text-white hover:bg-white/20'
              render={<Link href='/agent/dashboard' />}
            >
              {t('agentLogin')}
            </Button>
          </Child>
        </div>
      </Wrapper>
    </section>
  )
}
