'use client'

import { useState, useEffect, useCallback } from 'react'
import { Building2, Edit, Eye, MoreVertical, Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Link } from '@/i18n/navigation'
import { type AgentProperty } from '@/lib/api/agent'
import { clientFetch } from '@/lib/api/client'

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Active: 'default',
  RESERVED: 'outline',
  Draft: 'secondary',
  Sold: 'destructive',
  Rented: 'destructive',
  Expired: 'secondary',
  Rejected: 'destructive',
}

export function AgentPropertiesClient() {
  const t = useTranslations('agentProperties')
  const [properties, setProperties] = useState<AgentProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchProperties = useCallback(async () => {
    try {
      const data = await clientFetch<{ properties: AgentProperty[] }>('/agents/properties')
      if (data?.properties) {
        setProperties(data.properties)
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  async function handleDelete(property: AgentProperty) {
    const confirmed = window.confirm(
      t('confirmDelete', { title: property.title }) ?? `Delete "${property.title}"? This cannot be undone.`
    )
    if (!confirmed) return

    setDeletingId(property.id)
    try {
      const res = await fetch(`/api/backend/properties/${property.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `HTTP ${res.status}`)
      }
      toast.success(t('deleteSuccess') ?? 'Property deleted')
      setProperties(prev => prev.filter(p => p.id !== property.id))
    } catch (err: any) {
      toast.error(err.message ?? t('deleteFailed') ?? 'Failed to delete property')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleStatusChange(property: AgentProperty, newStatus: string) {
    try {
      const res = await fetch(`/api/backend/properties/${property.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `HTTP ${res.status}`)
      }
      toast.success(t('statusUpdated') ?? `Status updated to ${newStatus}`)
      setProperties(prev =>
        prev.map(p => (p.id === property.id ? { ...p, status: newStatus } : p))
      )
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to update status')
    }
  }

  if (loading) {
    return <div className='mx-auto max-w-7xl px-4 py-10'>Loading...</div>
  }

  return (
    <div className='mx-auto max-w-7xl px-4 py-10'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>{t('title')}</h1>
          <p className='mt-1 text-sm text-muted-foreground'>{t('description')}</p>
        </div>
        <Button render={<Link href='/agent/properties/new' />}>
          <Plus className='h-4 w-4 me-2' />
          {t('addProperty')}
        </Button>
      </div>

      <div className='space-y-4'>
        {properties.map(property => (
          <Card key={property.id} className='p-6'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex-1'>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <h3 className='font-semibold'>{property.title}</h3>
                    <p className='mt-1 text-sm text-muted-foreground'>{property.location}</p>
                  </div>
                  <Badge variant={statusVariant[property.status] ?? 'secondary'}>
                    {property.status}
                  </Badge>
                </div>
                <div className='mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground'>
                  <div className='flex items-center gap-1'>
                    <Building2 className='h-4 w-4' />
                    {property.type}
                  </div>
                  <div>
                    {property.bedrooms ?? 0} {t('bed')}
                  </div>
                  <div>
                    {property.bathrooms ?? 0} {t('bath')}
                  </div>
                  <div>
                    {property.areaSqft?.toLocaleString() ?? '0'} {t('sqft')}
                  </div>
                </div>
                <div className='mt-4 flex items-center justify-between'>
                  <div className='text-lg font-bold'>AED {property.price.toLocaleString()}</div>
                  <div className='flex gap-4 text-sm text-muted-foreground'>
                    <div>
                      {property.views} {t('views')}
                    </div>
                    <div>
                      {property.inquiries} {t('inquiries')}
                    </div>
                  </div>
                </div>
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  render={<Link href={`/properties/${property.slug}`} />}
                >
                  <Eye className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  render={<Link href={`/agent/properties/${property.id}/edit`} />}
                >
                  <Edit className='h-4 w-4' />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant='outline' size='sm' />}
                  >
                    <MoreVertical className='h-4 w-4' />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    {property.status === 'ACTIVE' && (
                      <>
                        <DropdownMenuItem onClick={() => handleStatusChange(property, 'SOLD')}>
                          {t('markAsSold') ?? 'Mark as Sold'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(property, 'RENTED')}>
                          {t('markAsRented') ?? 'Mark as Rented'}
                        </DropdownMenuItem>
                      </>
                    )}
                    {property.status !== 'EXPIRED' && property.status !== 'SOLD' && property.status !== 'RENTED' && (
                      <DropdownMenuItem onClick={() => handleStatusChange(property, 'EXPIRED')}>
                        {t('markAsExpired') ?? 'Mark as Expired'}
                      </DropdownMenuItem>
                    )}
                    {(property.status === 'SOLD' || property.status === 'RENTED') && (
                      <DropdownMenuItem onClick={() => handleStatusChange(property, 'ACTIVE')}>
                        {t('markAsActive') ?? 'Mark as Active'}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleDelete(property)}
                      className='text-destructive'
                    >
                      {t('delete') ?? 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
