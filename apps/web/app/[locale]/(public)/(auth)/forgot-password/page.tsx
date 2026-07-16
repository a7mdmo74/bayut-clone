'use client'
import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? t('forgotPasswordFailed'))
        setIsLoading(false)
        return
      }

      toast.success(t('forgotPasswordSuccess'))
      router.push('/login')
    } catch (err) {
      setError(t('forgotPasswordFailed'))
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-hero'>
      <div className='mx-auto flex min-h-screen max-w-md items-center px-4'>
        <div className='w-full rounded-2xl bg-card p-8 shadow-elegant'>
          <h1 className='text-2xl font-bold'>{t('forgotPasswordTitle')}</h1>
          <p className='mt-1 text-sm text-muted-foreground'>{t('forgotPasswordDescription')}</p>

          <form onSubmit={handleSubmit} className='mt-6 space-y-4'>
            {error && (
              <div className='rounded-lg bg-destructive/10 p-3 text-sm text-destructive'>
                {error}
              </div>
            )}
            <div className='space-y-2'>
              <Label htmlFor='email'>{t('email')}</Label>
              <Input
                id='email'
                name='email'
                type='email'
                placeholder='you@email.com'
                value={email}
                onChange={event => setEmail(event.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? t('sending') : t('sendResetLink')}
            </Button>
          </form>

          <div className='mt-4 text-center text-sm text-muted-foreground'>
            <Link href='/login' className='text-primary hover:underline'>
              {t('backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
