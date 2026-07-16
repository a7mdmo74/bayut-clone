'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Link } from '@/i18n/navigation'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface Slot {
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

export default function AgentAvailabilityPage() {
  const t = useTranslations('agentAvailability')
  const [slots, setSlots] = useState<Slot[]>(
    DAYS.map((_, i) => ({ dayOfWeek: i, startTime: '09:00', endTime: '17:00', isActive: false }))
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchAvailability() {
      try {
        const res = await fetch('/api/backend/availability', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            const loaded = DAYS.map((_, i) => {
              const found = data.find((s: any) => s.dayOfWeek === i)
              return found
                ? { dayOfWeek: i, startTime: found.startTime, endTime: found.endTime, isActive: found.isActive }
                : { dayOfWeek: i, startTime: '09:00', endTime: '17:00', isActive: false }
            })
            setSlots(loaded)
          }
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchAvailability()
  }, [])

  function updateSlot(index: number, updates: Partial<Slot>) {
    setSlots(prev => prev.map((s, i) => (i === index ? { ...s, ...updates } : s)))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const activeSlots = slots.filter(s => s.isActive)
      const res = await fetch('/api/backend/availability', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: activeSlots }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success(t('saveSuccess') ?? 'Availability saved')
    } catch {
      toast.error(t('saveFailed') ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className='p-10 text-center'>Loading...</div>

  return (
    <div className='mx-auto max-w-3xl px-4 py-10'>
      <div className='mb-8'>
        <p className='text-sm text-muted-foreground'>
          <Link href='/agent/dashboard' className='hover:text-foreground hover:underline'>
            {t('backToDashboard') ?? '← Back to dashboard'}
          </Link>
        </p>
        <h1 className='mt-2 text-2xl font-bold'>{t('title')}</h1>
        <p className='mt-1 text-sm text-muted-foreground'>{t('description')}</p>
      </div>

      <Card className='p-6 space-y-4'>
        {DAYS.map((day, i) => (
          <div key={i} className='flex items-center gap-4 py-2 border-b border-border last:border-0'>
            <div className='w-28'>
              <Switch
                checked={slots[i].isActive}
                onCheckedChange={checked => updateSlot(i, { isActive: checked })}
              />
            </div>
            <span className={`w-28 text-sm font-medium ${slots[i].isActive ? '' : 'text-muted-foreground'}`}>
              {day}
            </span>
            {slots[i].isActive ? (
              <div className='flex items-center gap-2'>
                <Input
                  type='time'
                  value={slots[i].startTime}
                  onChange={e => updateSlot(i, { startTime: e.target.value })}
                  className='w-32'
                />
                <span className='text-muted-foreground'>to</span>
                <Input
                  type='time'
                  value={slots[i].endTime}
                  onChange={e => updateSlot(i, { endTime: e.target.value })}
                  className='w-32'
                />
              </div>
            ) : (
              <span className='text-sm text-muted-foreground'>—</span>
            )}
          </div>
        ))}
      </Card>

      <div className='mt-6 flex gap-3'>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? '...' : (t('save') ?? 'Save Availability')}
        </Button>
        <Button variant='outline' render={<Link href='/agent/dashboard' />}>
          {t('cancel') ?? 'Cancel'}
        </Button>
      </div>
    </div>
  )
}
