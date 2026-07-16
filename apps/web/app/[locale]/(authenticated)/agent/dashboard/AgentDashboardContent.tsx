'use client'

import { Building2, CreditCard, Home, Plus, Settings, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Link } from '@/i18n/navigation'
import { useEffect, useState } from 'react'
import { clientFetch } from '@/lib/api/client'
import { useTranslations } from 'next-intl'

interface DashboardStats {
  activeListings: number
  totalViews: number
  inquiries: number
  leadCredits: number
}

interface AgentProperty {
  id: string
  slug: string
  title: string
  type: string
  price: number
  status: string
  views: number
  inquiries: number
}

interface Lead {
  message: string | null
  id: string
  propertyTitle: string
  senderName: string
  senderEmail: string
  senderPhone: string | null
  status: string
  createdAt: string
}

export function AgentDashboardContent() {
  const t = useTranslations('agentDashboard')
  const [subscription, setSubscription] = useState<any>(null)
  const [statsData, setStatsData] = useState<DashboardStats>({
    activeListings: 0,
    totalViews: 0,
    inquiries: 0,
    leadCredits: 0,
  })
  const [propertiesData, setPropertiesData] = useState<AgentProperty[]>([])
  const [leadsData, setLeadsData] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [subData, stats, properties, leads] = await Promise.all([
          clientFetch('/payments/subscription').catch(() => null),
          clientFetch('/agents/dashboard/stats').catch(() => null),
          clientFetch('/agents/properties').catch(() => null),
          clientFetch('/leads').catch(() => null),
        ])

        if (subData) {
          setSubscription(subData)
        }

        if (stats && typeof stats === 'object') {
          setStatsData(stats as DashboardStats)
        }

        if (properties && typeof properties === 'object' && 'properties' in properties) {
          setPropertiesData((properties as any).properties || [])
        }

        if (leads && typeof leads === 'object' && 'leads' in leads) {
          setLeadsData((leads as any).leads || [])
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const stats = [
    {
      label: t('stats.activeListings'),
      value: statsData.activeListings.toString(),
      icon: <Home className='h-4 w-4' />,
    },
    {
      label: t('stats.totalViews'),
      value: statsData.totalViews.toLocaleString(),
      icon: <TrendingUp className='h-4 w-4' />,
    },
    {
      label: t('stats.inquiries'),
      value: statsData.inquiries.toString(),
      icon: <Building2 className='h-4 w-4' />,
    },
    {
      label: t('stats.leadCredits'),
      value: statsData.leadCredits.toString(),
      icon: <CreditCard className='h-4 w-4' />,
    },
  ]

  const properties = propertiesData.slice(0, 3)

  const leads = leadsData.slice(0, 5)

  return (
    <div className='min-h-screen bg-muted/30'>
      <div className='mx-auto max-w-7xl px-4 py-10'>
        <div className='mb-8 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold'>{t('greeting')}</h1>
            <p className='mt-1 text-sm text-muted-foreground'>{t('description')}</p>
          </div>
          <Button render={<Link href='/agent/properties/new' />}>
            <Plus className='h-4 w-4 me-2' />
            {t('addProperty')}
          </Button>
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

        {/* Subscription Alert */}
        {!subscription && (
          <Card className='mb-8 border-orange-200 bg-orange-50 p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='font-semibold text-orange-900'>{t('noSubscriptionTitle')}</h3>
                <p className='mt-1 text-sm text-orange-700'>{t('noSubscriptionDescription')}</p>
              </div>
              <Button
                variant='outline'
                className='border-orange-300 text-orange-900 hover:bg-orange-100'
                render={<Link href='/agent/billing' />}
              >
                {t('viewPlans')}
              </Button>
            </div>
          </Card>
        )}

        <Tabs defaultValue='properties' className='space-y-6'>
          <TabsList>
            <TabsTrigger value='properties'>
              <Home className='h-4 w-4 me-2' />
              {t('tabs.properties')}
            </TabsTrigger>
            <TabsTrigger value='inquiries'>
              <Building2 className='h-4 w-4 me-2' />
              {t('tabs.inquiries')}
            </TabsTrigger>
            <TabsTrigger value='analytics'>
              <TrendingUp className='h-4 w-4 me-2' />
              {t('tabs.analytics')}
            </TabsTrigger>
            <TabsTrigger value='settings'>
              <Settings className='h-4 w-4 me-2' />
              {t('tabs.settings')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value='properties' className='space-y-4'>
            <div className='rounded-lg border bg-card'>
              <div className='grid grid-cols-6 border-b p-4 text-sm font-medium text-muted-foreground'>
                <div className='col-span-2'>{t('table.property')}</div>
                <div>{t('table.type')}</div>
                <div>{t('table.price')}</div>
                <div>{t('table.message')}</div>
                  <div>{t('table.status')}</div>
                <div className='text-right'>{t('table.actions')}</div>
              </div>
              {properties.map(property => (
                <div
                  key={property.id}
                  className='grid grid-cols-6 border-b p-4 text-sm last:border-b-0'
                >
                  <div className='col-span-2 font-medium'>{property.title}</div>
                  <div className='text-muted-foreground'>{property.type}</div>
                  <div>AED {property.price.toLocaleString()}</div>
                  <div>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        property.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {property.status}
                    </span>
                  </div>
                  <div className='text-right'>
                    <Button
                      variant='ghost'
                      size='sm'
                      render={<Link href={`/properties/${property.slug}`} />}
                    >
                      {t('table.view')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value='inquiries' className='space-y-4'>
            {leads.length === 0 ? (
              <Card className='p-8 text-center'>
                <Building2 className='mx-auto h-12 w-12 text-muted-foreground' />
                <h3 className='mt-4 font-semibold'>{t('noInquiries')}</h3>
                <p className='mt-2 text-sm text-muted-foreground'>{t('noInquiriesDescription')}</p>
              </Card>
            ) : (
              <div className='rounded-lg border bg-card'>
                <div className='grid grid-cols-6 border-b p-4 text-sm font-medium text-muted-foreground'>
                  <div>{t('table.property')}</div>
                  <div>{t('table.sender')}</div>
                  <div>{t('table.email')}</div>
                  <div>{t('table.phone')}</div>
                  <div>{t('table.message')}</div>
                  <div>{t('table.status')}</div>
                </div>
                {leads.map(lead => (
                  <div
                    key={lead.id}
                    className='grid grid-cols-6 border-b p-4 text-sm last:border-b-0'
                  >
                    <div className='font-medium'>{lead.propertyTitle}</div>
                    <div className='text-muted-foreground'>{lead.senderName}</div>
                    <div className='text-muted-foreground'>{lead.senderEmail}</div>
                    <div className='text-muted-foreground'>{lead.senderPhone || '—'}</div>
                    <div className='text-muted-foreground truncate' title={lead.message || ''}>{lead.message || '—'}</div>
                    <div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          lead.status === 'NEW'
                            ? 'bg-blue-100 text-blue-800'
                            : lead.status === 'CONTACTED'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value='analytics' className='space-y-4'>
            <Card className='p-8 text-center'>
              <TrendingUp className='mx-auto h-12 w-12 text-muted-foreground' />
              <h3 className='mt-4 font-semibold'>{t('analyticsComingSoon')}</h3>
              <p className='mt-2 text-sm text-muted-foreground'>
                {t('analyticsComingSoonDescription')}
              </p>
            </Card>
          </TabsContent>

          <TabsContent value='settings' className='space-y-4'>
            <Card className='p-6'>
              <h3 className='font-semibold mb-4'>{t('accountSettings')}</h3>
              <div className='space-y-4'>
                <Button
                  variant='outline'
                  className='w-full justify-start'
                  render={<Link href='/agent/billing' />}
                >
                  <CreditCard className='h-4 w-4 me-2' />
                  {t('billingSettings')}
                </Button>
                <Button variant='outline' className='w-full justify-start' disabled>
                  <Settings className='h-4 w-4 me-2' />
                  {t('profileSettings')}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}