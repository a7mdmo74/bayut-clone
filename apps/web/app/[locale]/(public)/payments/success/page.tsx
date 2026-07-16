import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { PaymentSuccessClient } from './PaymentSuccessClient'
import { getPaymentByIdServer } from '@/lib/api/payments-server'

interface SuccessPageProps {
  searchParams: Promise<{ payment_id?: string }>
}

export default async function PaymentSuccessPage({ searchParams }: SuccessPageProps) {
  const { payment_id } = await searchParams

  if (!payment_id) {
    redirect('/buy')
  }

  let payment = null
  let isLoading = true

  try {
    payment = await getPaymentByIdServer(payment_id)
    isLoading = false
  } catch (error) {
    console.error('Failed to load payment success data:', error)
    isLoading = false
  }

  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-muted/30 flex items-center justify-center px-4'>
          <div className='w-full max-w-md'>
            <div className='rounded-lg bg-card p-8 text-center shadow-elegant'>
              <div className='mx-auto h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent' />
            </div>
          </div>
        </div>
      }
    >
      <PaymentSuccessClient payment={payment} isLoading={isLoading} />
    </Suspense>
  )
}
