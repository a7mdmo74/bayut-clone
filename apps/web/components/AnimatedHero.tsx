'use client'

import { BadgeCheck, Building2, ShieldCheck, Users } from 'lucide-react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { HeroSearch } from '@/components/HeroSearch'
import { useDirection } from '@/hooks/useDirection'
import { fadeInUp, transition } from '@/lib/motion'

const statItems = [
  { icon: Building2, key: 'listings' },
  { icon: Users, key: 'agents' },
  { icon: ShieldCheck, key: 'verified' },
] as const

export function AnimatedHero() {
  const t = useTranslations('home')
  const dir = useDirection()
  const prefersReduced = useReducedMotion()

  return (
    <section className='relative overflow-hidden bg-gradient-hero text-white'>
      {/* Ken Burns background image */}
      <motion.div
        className='absolute inset-0 opacity-25'
        initial={{ scale: 1 }}
        animate={prefersReduced ? { scale: 1 } : { scale: 1.05 }}
        transition={{ duration: 8, ease: 'linear' }}
      >
        <Image
          src='/hero_buyer.jpeg'
          alt='Dubai Skyline'
          fill
          className='object-cover bg-fixed'
          priority
          sizes='100vw'
        />
      </motion.div>

      <div className='relative mx-auto max-w-7xl px-4 py-20 md:py-32'>
        <div className='max-w-2xl'>
          <BrandLogo variant='reversed' className='mb-4 h-8' priority />

          {/* Trust badge */}
          <motion.div
            className='mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur'
            variants={fadeInUp}
            initial='hidden'
            animate='visible'
            transition={transition.stagger(0)}
          >
            <BadgeCheck className='h-3.5 w-3.5' /> {t('trusted')}
          </motion.div>

          {/* Headline */}
          <motion.h1
            className='text-4xl font-bold tracking-tight md:text-6xl'
            variants={fadeInUp}
            initial='hidden'
            animate='visible'
            transition={transition.stagger(1)}
          >
            {t('title')}
          </motion.h1>

          {/* Subheading */}
          <motion.p
            className='mt-4 text-lg text-white/85'
            variants={fadeInUp}
            initial='hidden'
            animate='visible'
            transition={transition.stagger(2)}
          >
            {t('description')}
          </motion.p>
        </div>

        {/* Search bar */}
        <motion.div
          className='mt-8'
          variants={fadeInUp}
          initial='hidden'
          animate='visible'
          transition={transition.stagger(3)}
        >
          <HeroSearch />
        </motion.div>

        {/* Stat row */}
        <div className='mt-8 flex flex-wrap gap-6 text-sm text-white/80'>
          {statItems.map(({ icon: Icon, key }, i) => (
            <motion.div
              key={key}
              className='flex items-center gap-2'
              variants={fadeInUp}
              initial='hidden'
              animate='visible'
              transition={transition.stagger(4 + i)}
            >
              <Icon className='h-4 w-4' /> {t(key)}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
