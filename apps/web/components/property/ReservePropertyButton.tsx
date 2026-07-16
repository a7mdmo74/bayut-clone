'use client'

import { useTranslations } from 'next-intl'
import { CheckoutButton } from '@/components/payments/CheckoutButton'
import { PROPERTY_RESERVATION_FEE_AED } from '@repo/types'

interface ReservePropertyButtonProps {
  propertyId: string
  className?: string
}

export function ReservePropertyButton({ propertyId, className }: ReservePropertyButtonProps) {
  const t = useTranslations('property')

  return (
    <div className={className}>
      <CheckoutButton
        className='w-full'
        input={{
          purpose: 'PROPERTY_RESERVATION',
          propertyId,
        }}
      >
        {t('reserveProperty', { amount: PROPERTY_RESERVATION_FEE_AED })}
      </CheckoutButton>
      <p className='mt-2 text-xs text-muted-foreground'>{t('reservePropertyNote')}</p>
    </div>
  )
}
