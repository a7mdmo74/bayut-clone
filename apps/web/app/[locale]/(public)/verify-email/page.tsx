'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { toast } from 'sonner'

export default function VerifyEmailPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError(t('invalidVerificationLink') ?? 'Invalid verification link')
      return
    }

    async function verify() {
      try {
        const res = await fetch('/api/backend/auth/verify-email', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(body?.error ?? `HTTP ${res.status}`)
        }

        setStatus('success')
        toast.success(t('emailVerified') ?? 'Email verified successfully!')
      } catch (err: any) {
        setStatus('error')
        setError(err.message ?? t('verificationFailed') ?? 'Verification failed')
      }
    }

    verify()
  }, [token, t])

  if (status === 'loading') {
    return (
      <div className='min-h-screen bg-gradient-hero'>
        <div className='mx-auto flex min-h-screen max-w-md items-center px-4'>
          <div className='w-full rounded-2xl bg-card p-8 shadow-elegant text-center'>
            <div className='animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto' />
            <p className='mt-4 text-muted-foreground'>{t('verifying') ?? 'Verifying your email...'}</p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className='min-h-screen bg-gradient-hero'>
        <div className='mx-auto flex min-h-screen max-w-md items-center px-4'>
          <div className='w-full rounded-2xl bg-card p-8 shadow-elegant text-center'>
            <div className='text-4xl mb-4'>❌</div>
            <h1 className='text-2xl font-bold'>{t('verificationFailed') ?? 'Verification Failed'}</h1>
            <p className='mt-2 text-muted-foreground'>{error}</p>
            <Button className='mt-6' render={<Link href='/login' />}>
              {t('backToLogin') ?? 'Back to Login'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-hero'>
      <div className='mx-auto flex min-h-screen max-w-md items-center px-4'>
        <div className='w-full rounded-2xl bg-card p-8 shadow-elegant text-center'>
          <div className='text-4xl mb-4'>✅</div>
          <h1 className='text-2xl font-bold'>{t('emailVerified') ?? 'Email Verified!'}</h1>
          <p className='mt-2 text-muted-foreground'>
            {t('emailVerifiedDescription') ?? 'Your email has been verified. You can now access all features.'}
          </p>
          <Button className='mt-6' onClick={() => router.push('/')}>
            {t('goToHome') ?? 'Go to Home'}
          </Button>
        </div>
      </div>
    </div>
  )
}
