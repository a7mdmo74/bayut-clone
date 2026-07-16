'use client'

import { Building2, Users, CreditCard, Shield, Settings, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEffect, useMemo, useState } from 'react'
import { clientFetch } from '@/lib/api/client'
import { useTranslations } from 'next-intl'
import type { AdminActivity, AdminDashboardStats } from '@/lib/api/admin'
import type { PendingPropertyDTO, UserDTO } from '@repo/types'

export function AdminDashboardContent() {
  const t = useTranslations('adminDashboard')
  const [statsData, setStatsData] = useState<AdminDashboardStats>({
    totalUsers: 0,
    totalAgents: 0,
    totalProperties: 0,
    totalRevenue: 0,
  })
  const [recentActivity, setRecentActivity] = useState<AdminActivity[]>([])
  const [users, setUsers] = useState<UserDTO[]>([])
  const [pendingProperties, setPendingProperties] = useState<PendingPropertyDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUsersLoading, setIsUsersLoading] = useState(true)
  const [isPropertiesLoading, setIsPropertiesLoading] = useState(true)
  const [userActionError, setUserActionError] = useState<string | null>(null)
  const [propertyActionError, setPropertyActionError] = useState<string | null>(null)
  const [propertyActionLoading, setPropertyActionLoading] = useState<string | null>(null)
  const [confirmReview, setConfirmReview] = useState<{
    id: string
    status: 'ACTIVE' | 'REJECTED'
  } | null>(null)

  const agentUsers = useMemo(
    () => users.filter(user => user.role === 'AGENT' || user.role === 'AGENCY_ADMIN'),
    [users]
  )

  const paymentActivities = useMemo(
    () => recentActivity.filter(activity => /payment|subscription/i.test(activity.action)),
    [recentActivity]
  )

  async function loadOverview() {
    try {
      const [stats, activity] = await Promise.all([
        clientFetch('/admin/dashboard/stats'),
        clientFetch('/admin/recent-activity'),
      ])

      if (stats && typeof stats === 'object') {
        setStatsData(stats as AdminDashboardStats)
      }

      if (activity && Array.isArray(activity)) {
        setRecentActivity(activity as AdminActivity[])
      }
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadUsers() {
    setIsUsersLoading(true)
    try {
      const response = await clientFetch<{ data: UserDTO[] }>('/admin/users?page=1&limit=50')
      if (response && Array.isArray(response.data)) {
        setUsers(response.data)
      }
    } catch (error) {
      console.error('Failed to load admin users:', error)
    } finally {
      setIsUsersLoading(false)
    }
  }

  async function loadPendingProperties() {
    setIsPropertiesLoading(true)
    try {
      const response = await clientFetch<PendingPropertyDTO[]>('/admin/properties/pending')
      if (Array.isArray(response)) {
        setPendingProperties(response)
      }
    } catch (error) {
      console.error('Failed to load pending properties:', error)
    } finally {
      setIsPropertiesLoading(false)
    }
  }

  async function refreshPendingProperties() {
    await loadPendingProperties()
  }

  useEffect(() => {
    loadOverview()
    loadUsers()
    loadPendingProperties()
  }, [])

  const handleToggleUserActive = async (userId: string, isActive: boolean) => {
    setUserActionError(null)

    try {
      const res = await fetch(`/api/backend/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (!res.ok) {
        const error = await res.text()
        setUserActionError(error || 'Unable to update user status')
        return
      }

      const updatedUser = (await res.json()) as UserDTO
      setUsers(prev => prev.map(user => (user.id === updatedUser.id ? updatedUser : user)))
    } catch (error) {
      setUserActionError('Unable to update user status')
      console.error(error)
    }
  }

  const handleReviewProperty = async (propertyId: string, status: 'ACTIVE' | 'REJECTED') => {
    setPropertyActionError(null)
    setPropertyActionLoading(propertyId)

    try {
      const res = await fetch(`/api/backend/admin/properties/${propertyId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) {
        const error = await res.text()
        setPropertyActionError(error || 'Unable to update property status')
        return
      }

      setPendingProperties(prev => prev.filter(property => property.id !== propertyId))
    } catch (error) {
      setPropertyActionError('Unable to update property status')
      console.error(error)
    } finally {
      setPropertyActionLoading(null)
    }
  }

  if (isLoading) {
    return (
      <div className='min-h-screen bg-muted/30 flex items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent' />
          <p className='mt-4 text-muted-foreground'>Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  const stats = [
    {
      label: t('stats.totalUsers'),
      value: statsData.totalUsers.toLocaleString(),
      icon: <Users className='h-4 w-4' />,
    },
    {
      label: t('stats.totalAgents'),
      value: statsData.totalAgents.toLocaleString(),
      icon: <Building2 className='h-4 w-4' />,
    },
    {
      label: t('stats.totalProperties'),
      value: statsData.totalProperties.toLocaleString(),
      icon: <Building2 className='h-4 w-4' />,
    },
    {
      label: t('stats.totalRevenue'),
      value: `AED ${statsData.totalRevenue.toLocaleString()}`,
      icon: <CreditCard className='h-4 w-4' />,
    },
  ]

  return (
    <div className='min-h-screen bg-muted/30'>
      <div className='mx-auto max-w-7xl px-4 py-10'>
        <div className='mb-8'>
          <h1 className='text-2xl font-bold'>{t('greeting')}</h1>
          <p className='mt-1 text-sm text-muted-foreground'>{t('description')}</p>
        </div>

        {/* Stats */}
        <div className='mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {stats.map(stat => (
            <Card key={stat.label} className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <div className='text-2xl font-bold'>{stat.value}</div>
                  <div className='text-sm text-muted-foreground'>{stat.label}</div>
                </div>
                <div className='rounded-lg bg-primary/10 p-2 text-primary'>{stat.icon}</div>
              </div>
            </Card>
          ))}
        </div>

        <Tabs defaultValue='overview' className='space-y-6'>
          <TabsList>
            <TabsTrigger value='overview'>
              <TrendingUp className='h-4 w-4 me-2' />
              {t('tabs.overview')}
            </TabsTrigger>
            <TabsTrigger value='users'>
              <Users className='h-4 w-4 me-2' />
              {t('tabs.users')}
            </TabsTrigger>
            <TabsTrigger value='agents'>
              <Building2 className='h-4 w-4 me-2' />
              {t('tabs.agents')}
            </TabsTrigger>
            <TabsTrigger value='properties'>
              <Building2 className='h-4 w-4 me-2' />
              {t('tabs.properties')}
            </TabsTrigger>
            <TabsTrigger value='payments'>
              <CreditCard className='h-4 w-4 me-2' />
              {t('tabs.payments')}
            </TabsTrigger>
            <TabsTrigger value='settings'>
              <Settings className='h-4 w-4 me-2' />
              {t('tabs.settings')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-6'>
            <Card className='p-6'>
              <h3 className='font-semibold mb-4'>{t('recentActivity')}</h3>
              {recentActivity.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  {t('noRecentActivity')}
                </div>
              ) : (
                <div className='space-y-4'>
                  {recentActivity.map(activity => (
                    <div
                      key={activity.id}
                      className='flex items-center justify-between border-b pb-4 last:border-b-0'
                    >
                      <div>
                        <div className='font-medium'>{activity.action}</div>
                        <div className='text-sm text-muted-foreground'>{activity.user}</div>
                      </div>
                      <div className='text-sm text-muted-foreground'>{activity.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value='users' className='space-y-4'>
            {userActionError && (
              <div className='rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
                {userActionError}
              </div>
            )}
            {isUsersLoading ? (
              <div className='rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground'>
                Loading users…
              </div>
            ) : users.length === 0 ? (
              <div className='rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground'>
                No users found.
              </div>
            ) : (
              <div className='overflow-hidden rounded-xl border bg-card shadow-card'>
                <div className='grid grid-cols-6 gap-4 border-b bg-muted/50 px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground'>
                  <div className='col-span-2'>Name</div>
                  <div>Email</div>
                  <div>Role</div>
                  <div>Status</div>
                  <div className='text-right'>Actions</div>
                </div>
                {users.map(user => (
                  <div
                    key={user.id}
                    className='grid grid-cols-6 gap-4 border-b px-4 py-4 last:border-b-0 text-sm'
                  >
                    <div className='col-span-2'>
                      <div className='font-medium'>{`${user.firstName} ${user.lastName}`}</div>
                      <div className='text-muted-foreground text-xs'>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className='truncate'>{user.email}</div>
                    <div>{user.role}</div>
                    <div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                          user.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className='text-right'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleToggleUserActive(user.id, user.isActive)}
                      >
                        {user.isActive ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value='agents' className='space-y-4'>
            {isUsersLoading ? (
              <div className='rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground'>
                Loading agents…
              </div>
            ) : agentUsers.length === 0 ? (
              <div className='rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground'>
                No agents found.
              </div>
            ) : (
              <div className='overflow-hidden rounded-xl border bg-card shadow-card'>
                <div className='grid grid-cols-6 gap-4 border-b bg-muted/50 px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground'>
                  <div className='col-span-2'>Name</div>
                  <div>Email</div>
                  <div>Role</div>
                  <div>Status</div>
                  <div className='text-right'>Actions</div>
                </div>
                {agentUsers.map(user => (
                  <div
                    key={user.id}
                    className='grid grid-cols-6 gap-4 border-b px-4 py-4 last:border-b-0 text-sm'
                  >
                    <div className='col-span-2'>
                      <div className='font-medium'>{`${user.firstName} ${user.lastName}`}</div>
                      <div className='text-muted-foreground text-xs'>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className='truncate'>{user.email}</div>
                    <div>{user.role}</div>
                    <div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                          user.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className='text-right'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleToggleUserActive(user.id, user.isActive)}
                      >
                        {user.isActive ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value='properties' className='space-y-4'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div className='space-y-1'>
                <h3 className='text-lg font-semibold'>{t('pendingProperties')}</h3>
                <p className='text-sm text-muted-foreground'>{t('pendingPropertiesDescription')}</p>
              </div>
              <Button variant='secondary' size='sm' onClick={refreshPendingProperties}>
                Refresh list
              </Button>
            </div>

            {confirmReview && (
              <Card className='rounded-lg border bg-secondary/5 p-4'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                  <div>
                    <p className='text-sm text-muted-foreground'>
                      {confirmReview.status === 'ACTIVE'
                        ? 'Please confirm approval before submitting.'
                        : 'Please confirm rejection before submitting.'}
                    </p>
                  </div>
                  <div className='flex flex-wrap items-center gap-2'>
                    <Button variant='outline' size='sm' onClick={() => setConfirmReview(null)}>
                      Cancel
                    </Button>
                    <Button
                      size='sm'
                      onClick={() => {
                        if (confirmReview) {
                          handleReviewProperty(confirmReview.id, confirmReview.status)
                          setConfirmReview(null)
                        }
                      }}
                    >
                      Confirm {confirmReview.status === 'ACTIVE' ? 'Approve' : 'Reject'}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {propertyActionError && (
              <div className='rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
                {propertyActionError}
              </div>
            )}
            {isPropertiesLoading ? (
              <div className='rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground'>
                Loading pending properties…
              </div>
            ) : pendingProperties.length === 0 ? (
              <div className='rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground'>
                No pending properties found.
              </div>
            ) : (
              <div className='overflow-hidden rounded-xl border bg-card shadow-card'>
                <div className='grid grid-cols-6 gap-4 border-b bg-muted/50 px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground'>
                  <div>Title</div>
                  <div>Owner</div>
                  <div>Price</div>
                  <div>Created</div>
                  <div>Status</div>
                  <div className='text-right'>Actions</div>
                </div>
                {pendingProperties.map(property => (
                  <div
                    key={property.id}
                    className='grid grid-cols-6 gap-4 border-b px-4 py-4 last:border-b-0 text-sm'
                  >
                    <div className='font-medium truncate'>{property.title}</div>
                    <div className='truncate'>
                      {property.owner.firstName} {property.owner.lastName}
                    </div>
                    <div>AED {Number(property.price).toLocaleString()}</div>
                    <div>{new Date(property.createdAt).toLocaleDateString()}</div>
                    <div>
                      <span className='inline-flex rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800'>
                        {property.status}
                      </span>
                    </div>
                    <div className='text-right space-x-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setConfirmReview({ id: property.id, status: 'ACTIVE' })}
                        disabled={propertyActionLoading === property.id}
                      >
                        Approve
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        className='text-destructive border-destructive/40'
                        onClick={() => setConfirmReview({ id: property.id, status: 'REJECTED' })}
                        disabled={propertyActionLoading === property.id}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value='payments' className='space-y-4'>
            {paymentActivities.length === 0 ? (
              <div className='rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground'>
                No recent payment activity found.
              </div>
            ) : (
              <div className='space-y-4'>
                {paymentActivities.map(activity => (
                  <Card key={activity.id} className='p-4'>
                    <div className='flex items-center justify-between gap-4'>
                      <div>
                        <div className='font-medium'>{activity.action}</div>
                        <div className='text-sm text-muted-foreground'>{activity.user}</div>
                      </div>
                      <div className='text-sm text-muted-foreground'>{activity.time}</div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value='settings' className='space-y-4'>
            <Card className='p-6'>
              <h3 className='font-semibold mb-4'>{t('systemSettings')}</h3>
              <div className='space-y-4'>
                <Button variant='outline' className='w-full justify-start' disabled>
                  <Shield className='h-4 w-4 me-2' />
                  {t('securitySettings')}
                </Button>
                <Button variant='outline' className='w-full justify-start' disabled>
                  <Settings className='h-4 w-4 me-2' />
                  {t('generalSettings')}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
