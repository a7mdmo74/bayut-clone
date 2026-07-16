'use client'
import { LoginForm } from '@/components/auth/LoginForm'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Suspense } from 'react'

function LoginPage() {
  const t = useTranslations('auth')
  return (
    <div className='min-h-screen bg-gradient-hero'>
      <div className='mx-auto flex min-h-screen max-w-md items-center px-4'>
        <div className='w-full rounded-2xl bg-card p-8 shadow-elegant'>
          <Link href='/' className='mb-6 flex justify-center'>
            <BrandLogo variant='stacked' className='h-14' />
          </Link>
          <h1 className='text-2xl font-bold'>{t('welcome')}</h1>
          <p className='mt-1 text-sm text-muted-foreground'>{t('loginDescription')}</p>
          <div className='mt-6'>
            <Suspense fallback={<div className='h-40 animate-pulse rounded-lg bg-muted' />}>
              <LoginForm />
            </Suspense>{' '}
          </div>
          <div className='mt-4 text-center text-sm text-muted-foreground'>
            {t('newHere')}{' '}
            <Link href='/register' className='text-primary hover:underline'>
              {t('createAccount')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
