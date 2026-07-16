'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type { AuthUser } from '@repo/types'
import type { AgentProfile } from '@/lib/api/agent'
import { updateProfileSchema, changePasswordSchema } from '@repo/types'
import { clientFetch } from '@/lib/api/client'
import { updateAgentProfile } from '@/lib/api/agent'

interface AgentSettingsFormProps {
  user: AuthUser
}

export function AgentSettingsForm({ user }: AgentSettingsFormProps) {
  const t = useTranslations('settings')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingAgentProfile, setIsUpdatingAgentProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null)
  const [profileData, setProfileData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: (user as any).phone || '',
  })
  const [agentData, setAgentData] = useState({
    bio: '',
    languages: ['en'],
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    async function fetchAgentProfile() {
      try {
        const profile = await clientFetch<AgentProfile>('/agents/me')
        if (profile) {
          setAgentProfile(profile)
          setAgentData({
            bio: profile.bio || '',
            languages: profile.languages || ['en'],
          })
        }
      } catch (error) {
        console.error('Failed to fetch agent profile:', error)
      }
    }
    fetchAgentProfile()
  }, [])

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
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error(t('updateFailed'))
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  async function handleUpdateAgentProfile(e: React.FormEvent) {
    e.preventDefault()
    setIsUpdatingAgentProfile(true)

    try {
      const result = await updateAgentProfile({
        bio: agentData.bio,
        languages: agentData.languages,
      })

      if (result) {
        toast.success(t('profileUpdated'))
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to update agent profile:', error)
      toast.error(t('updateFailed'))
    } finally {
      setIsUpdatingAgentProfile(false)
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

          {/* Agent Profile Settings */}
          {agentProfile && (
            <Card className='p-6 shadow-elegant'>
              <h2 className='text-lg font-semibold'>{t('agentProfileSection')}</h2>
              <p className='mt-1 text-sm text-muted-foreground'>{t('agentProfileSectionDescription')}</p>

              {/* Agency Affiliation - Read Only */}
              {agentProfile.agency && (
                <div className='mt-4 rounded-lg bg-muted/50 p-4'>
                  <div className='flex items-center gap-3'>
                    {agentProfile.agency.logoUrl && (
                      <img
                        src={agentProfile.agency.logoUrl}
                        alt={agentProfile.agency.name}
                        className='h-10 w-10 rounded'
                      />
                    )}
                    <div>
                      <p className='font-medium'>{agentProfile.agency.name}</p>
                      {agentProfile.agency.licenseNo && (
                        <p className='text-xs text-muted-foreground'>{t('license')}: {agentProfile.agency.licenseNo}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleUpdateAgentProfile} className='mt-6 space-y-4'>
                <div>
                  <Label htmlFor='bio'>{t('bio')}</Label>
                  <Textarea
                    id='bio'
                    value={agentData.bio}
                    onChange={(e) => setAgentData({ ...agentData, bio: e.target.value })}
                    placeholder={t('bioPlaceholder')}
                    rows={4}
                    maxLength={1000}
                  />
                  <p className='mt-1 text-xs text-muted-foreground'>{t('bioMaxChars')}</p>
                </div>

                <div>
                  <Label htmlFor='languages'>{t('languages')}</Label>
                  <Input
                    id='languages'
                    value={agentData.languages.join(', ')}
                    onChange={(e) => setAgentData({ 
                      ...agentData, 
                      languages: e.target.value.split(',').map(l => l.trim()).filter(Boolean)
                    })}
                    placeholder={t('languagesPlaceholder')}
                  />
                  <p className='mt-1 text-xs text-muted-foreground'>{t('languagesHelp')}</p>
                </div>

                <Button type='submit' disabled={isUpdatingAgentProfile}>
                  {isUpdatingAgentProfile ? t('saving') : t('saveAgentProfile')}
                </Button>
              </form>
            </Card>
          )}

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
