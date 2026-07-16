'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Building2, Check, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { clientFetch } from '@/lib/api/client'

interface Agency {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  description: string | null
  phone: string | null
  email: string | null
  website: string | null
  licenseNo: string | null
  isVerified: boolean
  agentCount: number
  propertyCount: number
  createdAt: string
}

export default function AdminAgenciesPage() {
  const t = useTranslations('adminAgencies')
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', email: '', phone: '', licenseNo: '' })
  const [saving, setSaving] = useState(false)

  const fetchAgencies = useCallback(async () => {
    try {
      const data = await clientFetch<{ data: Agency[] }>('/agencies?limit=50')
      if (data) setAgencies(data.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAgencies() }, [fetchAgencies])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/backend/agencies', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `HTTP ${res.status}`)
      }
      toast.success(t('createSuccess') ?? 'Agency created')
      setForm({ name: '', description: '', email: '', phone: '', licenseNo: '' })
      setShowForm(false)
      fetchAgencies()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to create agency')
    } finally {
      setSaving(false)
    }
  }

  async function handleVerify(id: string) {
    try {
      const res = await fetch(`/api/backend/agencies/${id}/verify`, {
        method: 'PATCH',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(t('verifySuccess') ?? 'Agency verified')
      setAgencies(prev => prev.map(a => a.id === id ? { ...a, isVerified: true } : a))
    } catch {
      toast.error(t('verifyFailed') ?? 'Failed to verify')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('confirmDelete') ?? 'Delete this agency?')) return
    try {
      const res = await fetch(`/api/backend/agencies/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? 'Failed')
      }
      toast.success(t('deleteSuccess') ?? 'Agency deleted')
      setAgencies(prev => prev.filter(a => a.id !== id))
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to delete')
    }
  }

  if (loading) return <div className='p-10 text-center'>Loading...</div>

  return (
    <div className='mx-auto max-w-5xl px-4 py-10'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>{t('title')}</h1>
          <p className='mt-1 text-sm text-muted-foreground'>{t('description')}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className='h-4 w-4 me-2' />
          {t('addAgency')}
        </Button>
      </div>

      {showForm && (
        <Card className='p-6 mb-6'>
          <h2 className='text-lg font-semibold mb-4'>{t('newAgency')}</h2>
          <form onSubmit={handleCreate} className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>{t('name')}</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className='space-y-2'>
                <Label>{t('email')}</Label>
                <Input type='email' value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className='space-y-2'>
                <Label>{t('phone')}</Label>
                <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className='space-y-2'>
                <Label>{t('licenseNo')}</Label>
                <Input value={form.licenseNo} onChange={e => setForm(p => ({ ...p, licenseNo: e.target.value }))} />
              </div>
            </div>
            <div className='space-y-2'>
              <Label>{t('description')}</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            <div className='flex gap-2'>
              <Button type='submit' disabled={saving}>{saving ? '...' : (t('create') ?? 'Create')}</Button>
              <Button variant='outline' type='button' onClick={() => setShowForm(false)}>{t('cancel')}</Button>
            </div>
          </form>
        </Card>
      )}

      <div className='space-y-4'>
        {agencies.map(agency => (
          <Card key={agency.id} className='p-5'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex-1'>
                <div className='flex items-center gap-2'>
                  <h3 className='font-semibold'>{agency.name}</h3>
                  {agency.isVerified && <Badge variant='default'>Verified</Badge>}
                  {agency.licenseNo && <Badge variant='outline'>RERA {agency.licenseNo}</Badge>}
                </div>
                {agency.description && <p className='mt-1 text-sm text-muted-foreground line-clamp-2'>{agency.description}</p>}
                <div className='mt-2 flex gap-4 text-xs text-muted-foreground'>
                  <span>{agency.agentCount} agents</span>
                  <span>{agency.propertyCount} properties</span>
                  {agency.email && <span>{agency.email}</span>}
                  {agency.phone && <span>{agency.phone}</span>}
                </div>
              </div>
              <div className='flex gap-2'>
                {!agency.isVerified && (
                  <Button variant='outline' size='sm' onClick={() => handleVerify(agency.id)}>
                    <Check className='h-4 w-4 me-1' />
                    {t('verify') ?? 'Verify'}
                  </Button>
                )}
                <Button variant='outline' size='sm' className='text-destructive' onClick={() => handleDelete(agency.id)}>
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {agencies.length === 0 && (
          <p className='text-center text-muted-foreground py-10'>{t('noAgencies') ?? 'No agencies found'}</p>
        )}
      </div>
    </div>
  )
}
