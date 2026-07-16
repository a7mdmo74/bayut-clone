import Image from 'next/image'
import { cn } from '@/lib/utils'

const LOGOS = {
  horizontal: {
    src: '/bayara_primary_logo_horizontal.png',
    width: 160,
    height: 36,
  },
  stacked: {
    src: '/bayara_stacked_logo.png',
    width: 120,
    height: 72,
  },
  icon: {
    src: '/bayara_icon_mark.png',
    width: 40,
    height: 40,
  },
  reversed: {
    src: '/bayara_logo_reversed.png',
    width: 160,
    height: 40,
  },
  black: {
    src: '/bayara_logo_black.png',
    width: 140,
    height: 36,
  },
} as const

export type BrandLogoVariant = keyof typeof LOGOS

interface BrandLogoProps {
  variant?: BrandLogoVariant
  className?: string
  priority?: boolean
}

export function BrandLogo({ variant = 'stacked', className, priority }: BrandLogoProps) {
  const logo = LOGOS[variant]

  return (
    <Image
      src={logo.src}
      alt='Bayara'
      width={logo.width}
      height={logo.height}
      priority={priority}
      className={cn('h-auto w-auto object-contain', className)}
    />
  )
}
