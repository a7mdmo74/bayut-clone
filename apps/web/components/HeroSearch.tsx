'use client'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export function HeroSearch() {
  const navigate = useRouter()
  const t = useTranslations('search')
  const prefersReduced = useReducedMotion()

  const [tab, setTab] = useState<'Sale' | 'Rent'>('Sale')
  const [q, setQ] = useState('')
  const [type, setType] = useState('any')
  const [price, setPrice] = useState('any')

  const priceRanges = {
    Sale: [
      { value: 'any', label: t('anyPrice') },
      { value: '0-500000', label: t('upTo', { price: '500K' }) },
      { value: '500000-1500000', label: '500K – 1.5M' },
      { value: '1500000-4000000', label: '1.5M – 4M' },
      { value: '4000000-999999999', label: '4M+' },
    ],
    Rent: [
      { value: 'any', label: t('anyPrice') },
      { value: '0-30000', label: t('upTo', { price: '30K' }) },
      { value: '30000-75000', label: '30K – 75K' },
      { value: '75000-150000', label: '75K – 150K' },
      { value: '150000-999999999', label: '150K+' },
    ],
  }

  const submit = () => {
    const params = new URLSearchParams()
    const targetPath = tab === 'Sale' ? '/buy' : '/rent'

    if (q.trim()) params.set('q', q.trim())
    if (type !== 'any') params.set('type', type)
    if (price !== 'any') params.set('priceRange', price)

    const queryString = params.toString()
    navigate.push(`${targetPath}${queryString ? `?${queryString}` : ''}`)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submit()
    }
  }

  return (
    <div className='rounded-2xl bg-card p-2 shadow-elegant'>
      <div className='flex gap-1 p-1'>
        {(['Sale', 'Rent'] as const).map(listing => (
          <button
            key={listing}
            onClick={() => {
              setTab(listing)
              setPrice('any') // Reset price when switching tabs
            }}
            className={cn(
              'rounded-lg px-5 py-2 text-sm font-semibold transition',
              tab === listing
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {listing === 'Sale' ? t('buy') : t('rent')}
          </button>
        ))}
      </div>

      {/* min-w-0 on every grid child is required so they respect the grid track width
          instead of growing to fit their content (this was causing the width mismatch) */}
      <div className='grid gap-2 p-2 md:grid-cols-[1.4fr_1fr_1fr_auto]'>
        <div className='relative min-w-0'>
          <Search className='pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('location')}
            className='h-11 w-full ps-9 text-foreground placeholder:text-muted-foreground'
          />
        </div>

        <Select value={type} onValueChange={value => setType(value ?? 'any')}>
          <SelectTrigger
            className='h-11 w-full min-w-0 text-foreground'
            aria-label={t('propertyType')}
          >
            <SelectValue placeholder={t('propertyType')} className='text-foreground' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='any'>{t('anyType')}</SelectItem>
            <SelectItem value='Apartment'>{t('apartment')}</SelectItem>
            <SelectItem value='Villa'>{t('villa')}</SelectItem>
            <SelectItem value='Townhouse'>{t('townhouse')}</SelectItem>
            <SelectItem value='Penthouse'>{t('penthouse')}</SelectItem>
            <SelectItem value='Studio'>{t('studio')}</SelectItem>
            <SelectItem value='Office'>{t('office')}</SelectItem>
          </SelectContent>
        </Select>

        {prefersReduced ? (
          <div key={tab} className='min-w-0'>
            <Select
              value={price}
              onValueChange={value => setPrice(value ?? 'any')}
            >
              <SelectTrigger
                className='h-11 w-full min-w-0 text-foreground'
                aria-label={t('price')}
              >
                <SelectValue placeholder={t('price')} className='text-foreground' />
              </SelectTrigger>
              <SelectContent>
                {priceRanges[tab].map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <AnimatePresence mode='wait'>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className='min-w-0'
          >
            <Select
              value={price}
              onValueChange={value => setPrice(value ?? 'any')}
            >
              <SelectTrigger
                className='h-11 w-full min-w-0 text-foreground'
                aria-label={t('price')}
              >
                <SelectValue placeholder={t('price')} className='text-foreground' />
              </SelectTrigger>
              <SelectContent>
                {priceRanges[tab].map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        </AnimatePresence>
        )}

        <Button size='lg' onClick={submit} className='h-11 w-full px-8 md:w-auto'>
          {t('search')}
        </Button>
      </div>
    </div>
  )
}
