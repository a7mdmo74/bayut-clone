'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { loginSchema, type LoginInput } from '@repo/types'
import { getDashboardPath } from '@/lib/auth/redirects'

export function LoginForm() {
  const router = useRouter()
  const t = useTranslations('auth')
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')
  const redirectTo = redirectParam || '/dashboard'

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<LoginInput>({
    email: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateFieldOnBlur = (field: 'email' | 'password', value: string) => {
    const result = loginSchema.shape[field].safeParse(value)
    if (!result.success) {
      setErrors(prev => ({ ...prev, [field]: validationMessage(field, t) }))
      return
    }

    setErrors(prev => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'email' || name === 'password') {
      validateFieldOnBlur(name, value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    // Client-side validation
    const validationResult = loginSchema.safeParse(formData)
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors
      setErrors(
        Object.fromEntries(
          Object.entries(fieldErrors).map(([key]) => [key, validationMessage(key, t)])
        )
      )
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        // Handle backend errors
        if (data.fieldErrors) {
          setErrors(data.fieldErrors)
        } else if (data.error) {
          setErrors({ form: data.error })
        } else {
          setErrors({ form: t('loginFailed') })
        }
        setIsLoading(false)
        return
      }

      // Success
      const role = data?.role ?? data?.user?.role
      const target = redirectParam || getDashboardPath(role)

      toast.success(t('loginSuccess'))
      router.push(target)
      router.refresh()
    } catch (error) {
      setErrors({ form: t('genericError') })
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className='space-y-4'>
      {errors.form && (
        <div className='bg-destructive/10 text-destructive text-sm p-3 rounded-lg'>
          {errors.form}
        </div>
      )}

      <div className='space-y-2'>
        <Label htmlFor='email'>{t('email')}</Label>
        <Input
          id='email'
          name='email'
          type='email'
          placeholder='you@email.com'
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && <p className='text-destructive text-sm'>{errors.email}</p>}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='password'>{t('password')}</Label>
        <Input
          id='password'
          name='password'
          type='password'
          placeholder='••••••••'
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
          className={errors.password ? 'border-destructive' : ''}
        />
        {errors.password && <p className='text-destructive text-sm'>{errors.password}</p>}
      </div>

      <div className='flex items-center justify-between text-sm'>
        <Link href='/forgot-password' className='text-primary hover:underline'>
          {t('forgot')}
        </Link>
      </div>

      <Button type='submit' className='w-full' disabled={isLoading}>
        {isLoading ? t('loggingIn') : t('login')}
      </Button>
    </form>
  )
}

function validationMessage(field: string, t: ReturnType<typeof useTranslations>) {
  if (field === 'email') return t('validation.email')
  if (field === 'password') return t('validation.passwordRequired')
  return t('invalid')
}
