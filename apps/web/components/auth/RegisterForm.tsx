'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { registerSchema, type RegisterInput } from '@repo/types'
import { getDashboardPath } from '@/lib/auth/redirects'

export function RegisterForm() {
  const router = useRouter()
  const t = useTranslations('auth')
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')
  const redirectTo = redirectParam || '/dashboard'

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [role, setRole] = useState<'BUYER' | 'AGENT'>('BUYER')
  const [formData, setFormData] = useState<Omit<RegisterInput, 'role'>>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    // Client-side validation
    const validationResult = registerSchema.safeParse({ ...formData, role })
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Handle backend errors
        if (data.fieldErrors) {
          setErrors(data.fieldErrors)
        } else if (data.error) {
          // Translate common backend error messages
          const errorMessage =
            data.error === 'An account with this email already exists'
              ? t('emailExists')
              : data.error
          setErrors({ form: errorMessage })
        } else {
          setErrors({ form: t('registerFailed') })
        }
        setIsLoading(false)
        return
      }

      // Success
      toast.success(t('registerSuccess'))

      const roleFromResponse = data?.role ?? data?.user?.role
      const finalRedirect =
        redirectParam || getDashboardPath(roleFromResponse || role)
      router.push(finalRedirect)
      router.refresh()
    } catch (error) {
      setErrors({ form: t('genericError') })
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      {errors.form && (
        <div className='bg-destructive/10 text-destructive text-sm p-3 rounded-lg'>
          {errors.form}
        </div>
      )}

      <div>
        <Label>{t('role')}</Label>
        <RadioGroup
          value={role}
          onValueChange={value => setRole(value as 'BUYER' | 'AGENT')}
          className='mt-2 grid grid-cols-2 gap-2'
        >
          {[
            { value: 'BUYER', label: t('buyer') },
            { value: 'AGENT', label: t('agent') },
          ].map(option => (
            <label
              key={option.value}
              className={cn(
                'cursor-pointer rounded-lg border p-3 text-sm transition flex items-center',
                role === option.value ? 'border-primary bg-primary/5' : 'hover:bg-muted'
              )}
            >
              <RadioGroupItem value={option.value} className='sr-only' />
              {option.label}
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='firstName'>{t('firstName')}</Label>
          <Input
            id='firstName'
            name='firstName'
            placeholder='John'
            value={formData.firstName}
            onChange={handleChange}
            disabled={isLoading}
            className={errors.firstName ? 'border-destructive' : ''}
          />
          {errors.firstName && <p className='text-destructive text-sm'>{errors.firstName}</p>}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='lastName'>{t('lastName')}</Label>
          <Input
            id='lastName'
            name='lastName'
            placeholder='Doe'
            value={formData.lastName}
            onChange={handleChange}
            disabled={isLoading}
            className={errors.lastName ? 'border-destructive' : ''}
          />
          {errors.lastName && <p className='text-destructive text-sm'>{errors.lastName}</p>}
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='email'>{t('email')}</Label>
        <Input
          id='email'
          name='email'
          type='email'
          placeholder='you@email.com'
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && <p className='text-destructive text-sm'>{errors.email}</p>}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='phone'>{t('phone')}</Label>
        <Input
          id='phone'
          name='phone'
          type='tel'
          placeholder='+971 50 123 4567'
          value={formData.phone || ''}
          onChange={handleChange}
          disabled={isLoading}
          className={errors.phone ? 'border-destructive' : ''}
        />
        {errors.phone && <p className='text-destructive text-sm'>{errors.phone}</p>}
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
          disabled={isLoading}
          className={errors.password ? 'border-destructive' : ''}
        />
        {errors.password && <p className='text-destructive text-sm'>{errors.password}</p>}
      </div>

      <Button type='submit' className='w-full' disabled={isLoading}>
        {isLoading ? t('creating') : t('createAccount')}
      </Button>
    </form>
  )
}

function validationMessage(field: string, t: ReturnType<typeof useTranslations>) {
  const messages: Record<string, 'email' | 'passwordMin' | 'firstName' | 'lastName' | 'phone'> = {
    email: 'email',
    password: 'passwordMin',
    firstName: 'firstName',
    lastName: 'lastName',
    phone: 'phone',
  }
  return messages[field] ? t(`validation.${messages[field]}`) : t('invalid')
}
