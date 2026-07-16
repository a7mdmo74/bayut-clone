'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

interface MortgageCalculatorProps {
  price: number
}

export function MortgageCalculator({ price }: MortgageCalculatorProps) {
  const t = useTranslations('property.mortgage')
  const [downPayment, setDownPayment] = useState(20)
  const [years, setYears] = useState(25)
  const [rate, setRate] = useState(4.5)

  const principal = price * (1 - downPayment / 100)
  const monthlyRate = rate / 100 / 12
  const numPayments = years * 12

  const monthlyPayment =
    monthlyRate === 0
      ? principal / numPayments
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)

  const totalPayment = monthlyPayment * numPayments
  const totalInterest = totalPayment - principal

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(n)

  return (
    <Card className='p-5 space-y-4'>
      <h3 className='font-semibold text-foreground'>{t('title')}</h3>

      <div className='space-y-2'>
        <div className='flex justify-between text-sm'>
          <Label htmlFor='dp'>{t('downPayment')}</Label>
          <span className='text-muted-foreground'>{downPayment}%</span>
        </div>
        <Input
          id='dp'
          type='range'
          min={5}
          max={80}
          value={downPayment}
          onChange={e => setDownPayment(Number(e.target.value))}
          className='accent-primary'
        />
        <p className='text-xs text-muted-foreground'>
          AED {fmt(price * downPayment / 100)}
        </p>
      </div>

      <div className='space-y-2'>
        <div className='flex justify-between text-sm'>
          <Label htmlFor='years'>{t('loanTerm')}</Label>
          <span className='text-muted-foreground'>{years} {t('years')}</span>
        </div>
        <Input
          id='years'
          type='range'
          min={5}
          max={30}
          value={years}
          onChange={e => setYears(Number(e.target.value))}
          className='accent-primary'
        />
      </div>

      <div className='space-y-2'>
        <div className='flex justify-between text-sm'>
          <Label htmlFor='rate'>{t('interestRate')}</Label>
          <span className='text-muted-foreground'>{rate}%</span>
        </div>
        <Input
          id='rate'
          type='range'
          min={1}
          max={10}
          step={0.1}
          value={rate}
          onChange={e => setRate(Number(e.target.value))}
          className='accent-primary'
        />
      </div>

      <div className='border-t border-border pt-4 space-y-2'>
        <div className='flex justify-between'>
          <span className='text-sm text-muted-foreground'>{t('monthlyPayment')}</span>
          <span className='text-lg font-bold text-primary'>AED {fmt(monthlyPayment)}</span>
        </div>
        <div className='flex justify-between text-xs text-muted-foreground'>
          <span>{t('totalInterest')}</span>
          <span>AED {fmt(totalInterest)}</span>
        </div>
        <div className='flex justify-between text-xs text-muted-foreground'>
          <span>{t('totalCost')}</span>
          <span>AED {fmt(totalPayment)}</span>
        </div>
      </div>
    </Card>
  )
}
