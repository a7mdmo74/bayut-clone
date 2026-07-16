'use client'

import { Building2, Check, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export function BecomeAgentContent() {
  const t = useTranslations('becomeAgent')
  
  return (
    <div className='min-h-screen'>
      <div className='relative overflow-hidden bg-gradient-hero text-white'>
        <div className='mx-auto max-w-7xl px-4 py-20 md:py-32'>
          <div className='max-w-2xl'>
            <BrandLogo variant='reversed' className='mb-6 h-10' />
            <h1 className='text-4xl font-bold tracking-tight md:text-6xl'>{t('title')}</h1>
            <p className='mt-4 text-lg text-white/85'>{t('description')}</p>
            <div className='mt-8 flex flex-wrap gap-4'>
              <Button size='lg' variant='secondary' render={<Link href='/register' />}>
                {t('getStarted')}
              </Button>
              <Button
                size='lg'
                variant='outline'
                className='border-white/40 bg-white/10 text-white hover:bg-white/20'
                render={<Link href='/agent/dashboard' />}
              >
                {t('agentLogin')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className='mx-auto max-w-7xl px-4 py-16'>
        <h2 className='text-center text-2xl font-bold md:text-3xl'>{t('whyJoin')}</h2>
        <div className='mt-10 grid gap-6 md:grid-cols-3'>
          {[
            {
              icon: <Users className='h-5 w-5' />,
              title: t('benefits.reachTitle'),
              body: t('benefits.reachBody'),
            },
            {
              icon: <Zap className='h-5 w-5' />,
              title: t('benefits.listingTitle'),
              body: t('benefits.listingBody'),
            },
            {
              icon: <Building2 className='h-5 w-5' />,
              title: t('benefits.trustTitle'),
              body: t('benefits.trustBody'),
            },
          ].map((benefit, i) => (
            <div key={i} className='rounded-2xl border bg-card p-6 shadow-card'>
              <div className='grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary'>
                {benefit.icon}
              </div>
              <div className='mt-4 font-semibold'>{benefit.title}</div>
              <p className='mt-2 text-sm text-muted-foreground'>{benefit.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className='bg-muted/40 py-16'>
        <div className='mx-auto max-w-7xl px-4'>
          <h2 className='text-center text-2xl font-bold md:text-3xl'>{t('howItWorks')}</h2>
          <div className='mt-10 grid gap-6 md:grid-cols-4'>
            {[
              { step: '1', title: t('steps.createTitle'), body: t('steps.createBody') },
              { step: '2', title: t('steps.verifyTitle'), body: t('steps.verifyBody') },
              { step: '3', title: t('steps.listTitle'), body: t('steps.listBody') },
              { step: '4', title: t('steps.growTitle'), body: t('steps.growBody') },
            ].map((step) => (
              <div key={step.step} className='relative'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground'>
                  {step.step}
                </div>
                <div className='mt-4 font-semibold'>{step.title}</div>
                <p className='mt-2 text-sm text-muted-foreground'>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className='mx-auto max-w-7xl px-4 py-16'>
        <h2 className='text-center text-2xl font-bold md:text-3xl'>{t('pricing')}</h2>
        <div className='mt-10 grid gap-6 md:grid-cols-3'>
          {[
            {
              name: t('plans.starter'),
              price: t('plans.starterPrice'),
              features: [
                t('plans.featureListings', { count: 10 }),
                t('plans.featureFeatured', { count: 2 }),
                t('plans.featureSupport'),
              ],
            },
            {
              name: t('plans.professional'),
              price: t('plans.professionalPrice'),
              features: [
                t('plans.featureListings', { count: 50 }),
                t('plans.featureFeatured', { count: 10 }),
                t('plans.featureSupport'),
                t('plans.featureAnalytics'),
              ],
              highlighted: true,
            },
            {
              name: t('plans.enterprise'),
              price: t('plans.enterprisePrice'),
              features: [
                t('plans.featureUnlimited'),
                t('plans.featureFeatured', { count: 25 }),
                t('plans.featurePriority'),
                t('plans.featureAnalytics'),
                t('plans.featureDedicated'),
              ],
            },
          ].map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-2xl border p-6 shadow-card ${
                plan.highlighted ? 'border-primary bg-primary/5' : 'bg-card'
              }`}
            >
              {plan.highlighted && (
                <div className='absolute -top-3 start-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground'>
                  {t('popular')}
                </div>
              )}
              <h3 className='text-lg font-semibold'>{plan.name}</h3>
              <div className='mt-2'>
                <span className='text-3xl font-bold'>{plan.price}</span>
                <span className='text-sm text-muted-foreground'>/{t('month')}</span>
              </div>
              <ul className='mt-6 space-y-3 text-sm'>
                {plan.features.map((feature, j) => (
                  <li key={j} className='flex items-start gap-2'>
                    <Check className='h-4 w-4 shrink-0 text-primary mt-0.5' />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlighted ? 'default' : 'outline'}
                className='mt-6 w-full'
                render={<Link href='/register' />}
              >
                {t('getStarted')}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className='mx-auto mb-16 max-w-7xl px-4'>
        <div className='overflow-hidden rounded-2xl bg-gradient-primary p-8 text-primary-foreground md:p-12'>
          <div className='grid gap-8 md:grid-cols-[1.6fr_1fr] md:items-center'>
            <div>
              <h3 className='text-2xl font-bold md:text-3xl'>{t('ctaTitle')}</h3>
              <p className='mt-2 text-primary-foreground/85'>{t('ctaDescription')}</p>
            </div>
            <div className='flex flex-wrap gap-3 md:justify-end'>
              <Button size='lg' variant='secondary' render={<Link href='/register' />}>
                {t('getStarted')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}