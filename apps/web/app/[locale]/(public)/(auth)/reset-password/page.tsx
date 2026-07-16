'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError(t('passwordsMustMatch'))
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? t('resetPasswordFailed'))
        setIsLoading(false)
        return
      }

      toast.success(t('resetPasswordSuccess'))
      router.push('/login')
    } catch (err) {
      setError(t('resetPasswordFailed'))
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-hero'>
      <div className='mx-auto flex min-h-screen max-w-md items-center px-4'>
        <div className='w-full rounded-2xl bg-card p-8 shadow-elegant'>
          <h1 className='text-2xl font-bold'>{t('resetPasswordTitle')}</h1>
          <p className='mt-1 text-sm text-muted-foreground'>{t('resetPasswordDescription')}</p>

          <form onSubmit={handleSubmit} className='mt-6 space-y-4'>
            {error && (
              <div className='rounded-lg bg-destructive/10 p-3 text-sm text-destructive'>
                {error}
              </div>
            )}
            <div className='space-y-2'>
              <Label htmlFor='password'>{t('newPassword')}</Label>
              <Input
                id='password'
                name='password'
                type='password'
                placeholder='••••••••'
                value={password}
                onChange={event => setPassword(event.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>{t('confirmPassword')}</Label>
              <Input
                id='confirmPassword'
                name='confirmPassword'
                type='password'
                placeholder='••••••••'
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? t('resetting') : t('resetPassword')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
