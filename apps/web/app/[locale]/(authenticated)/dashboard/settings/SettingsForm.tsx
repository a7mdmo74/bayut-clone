'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import type { AuthUser } from '@repo/types'
import { updateProfileSchema, changePasswordSchema } from '@repo/types'
import { clientFetch } from '@/lib/api/client'

interface SettingsFormProps {
  user: AuthUser
}

export function SettingsForm({ user }: SettingsFormProps) {
  const t = useTranslations('settings')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: (user as any).phone || '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setIsUpdatingProfile(true)

    try {
      const validated = updateProfileSchema.parse(profileData)
      const result = await clientFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(validated),
      })

      if (result) {
        toast.success(t('profileUpdated'))
        // Refresh the page to show updated data
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error(t('updateFailed'))
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setIsChangingPassword(true)

    try {
      const validated = changePasswordSchema.parse(passwordData)
      const result = await clientFetch('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: validated.currentPassword,
          newPassword: validated.newPassword,
        }),
      })

      if (result) {
        toast.success(t('passwordChanged'))
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      }
    } catch (error) {
      console.error('Failed to change password:', error)
      toast.error(t('passwordChangeFailed'))
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className='min-h-screen bg-muted/30'>
      <div className='mx-auto max-w-3xl px-4 py-10'>
        <h1 className='text-2xl font-bold'>{t('title')}</h1>
        <p className='mt-1 text-sm text-muted-foreground'>{t('description')}</p>

        <div className='mt-8 space-y-6'>
          {/* Profile Settings */}
          <Card className='p-6 shadow-elegant'>
            <h2 className='text-lg font-semibold'>{t('profileSection')}</h2>
            <p className='mt-1 text-sm text-muted-foreground'>{t('profileSectionDescription')}</p>

            <form onSubmit={handleUpdateProfile} className='mt-6 space-y-4'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <Label htmlFor='firstName'>{t('firstName')}</Label>
                  <Input
                    id='firstName'
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor='lastName'>{t('lastName')}</Label>
                  <Input
                    id='lastName'
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor='phone'>{t('phone')}</Label>
                <Input
                  id='phone'
                  type='tel'
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder={t('phonePlaceholder')}
                />
              </div>

              <div>
                <Label htmlFor='email'>{t('email')}</Label>
                <Input
                  id='email'
                  type='email'
                  value={user.email}
                  disabled
                  className='bg-muted'
                />
                <p className='mt-1 text-xs text-muted-foreground'>{t('emailReadOnly')}</p>
              </div>

              <Button type='submit' disabled={isUpdatingProfile}>
                {isUpdatingProfile ? t('saving') : t('saveProfile')}
              </Button>
            </form>
          </Card>

          <Separator />

          {/* Password Settings */}
          <Card className='p-6 shadow-elegant'>
            <h2 className='text-lg font-semibold'>{t('passwordSection')}</h2>
            <p className='mt-1 text-sm text-muted-foreground'>{t('passwordSectionDescription')}</p>

            <form onSubmit={handleChangePassword} className='mt-6 space-y-4'>
              <div>
                <Label htmlFor='currentPassword'>{t('currentPassword')}</Label>
                <Input
                  id='currentPassword'
                  type='password'
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor='newPassword'>{t('newPassword')}</Label>
                <Input
                  id='newPassword'
                  type='password'
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor='confirmPassword'>{t('confirmPassword')}</Label>
                <Input
                  id='confirmPassword'
                  type='password'
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <Button type='submit' disabled={isChangingPassword} variant='outline'>
                {isChangingPassword ? t('changing') : t('changePassword')}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
