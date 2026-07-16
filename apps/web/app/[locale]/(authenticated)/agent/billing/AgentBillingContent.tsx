'use client'

import { CreditCard, Package, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckoutButton } from '@/components/payments/CheckoutButton'
import type { PlanDTO, SubscriptionDTO } from '@repo/types'
import { useEffect, useState } from 'react'
import { clientFetch } from '@/lib/api/client'
import { useTranslations } from 'next-intl'

export function AgentBillingContent() {
  const t = useTranslations('billing')
  const [plans, setPlans] = useState<PlanDTO[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionDTO | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [plansData, subscriptionData] = await Promise.all([
          clientFetch('/payments/plans'),
          clientFetch('/payments/subscription'),
        ])

        if (plansData && Array.isArray(plansData)) {
          setPlans(plansData as PlanDTO[])
        }

        if (subscriptionData && typeof subscriptionData === 'object') {
          setCurrentSubscription(subscriptionData as SubscriptionDTO)
        }
      } catch (error) {
        console.error('Failed to load billing data:', error)
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
          <p className="mt-4 text-muted-foreground">Loading billing information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        {/* Current Subscription */}
        {currentSubscription && (
          <Card className="mb-8 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">{currentSubscription.plan.name}</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('currentPlan', {
                    price: currentSubscription.plan.priceAed,
                    interval: currentSubscription.plan.interval.toLowerCase(),
                  })}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('renewsOn', { date: new Date(currentSubscription.currentPeriodEnd).toLocaleDateString() })}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-green-600">{t('active')}</div>
                <Button variant="outline" size="sm" className="mt-2">
                  {t('manage')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Available Plans */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">{t('availablePlans')}</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">AED {plan.priceAed}</span>
                    <span className="text-sm text-muted-foreground">/{plan.interval.toLowerCase()}</span>
                  </div>
                </div>
                <ul className="mb-6 space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    {t('listings', { count: plan.maxListings })}
                  </li>
                  <li className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-primary" />
                    {t('featured', { count: plan.maxFeatured })}
                  </li>
                </ul>
                <CheckoutButton
                  input={{
                    purpose: 'SUBSCRIPTION',
                    planId: plan.id,
                  }}
                  variant={currentSubscription?.plan.id === plan.id ? 'outline' : 'default'}
                  className="w-full"
                  disabled={currentSubscription?.plan.id === plan.id}
                >
                  {currentSubscription?.plan.id === plan.id ? t('active') : t('subscribe')}
                </CheckoutButton>
              </Card>
            ))}
          </div>
        </div>

        {/* Payment Providers Info */}
        <Card className="p-6">
          <h3 className="font-semibold mb-3">{t('paymentMethods')}</h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <CreditCard className="h-5 w-5" />
            <div>
              <div className="font-medium text-foreground">Credit/Debit Cards</div>
              <div>{t('cardDescription')}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}