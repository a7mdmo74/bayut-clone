import { Star, Clock, CreditCard } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckoutButton } from '@/components/payments/CheckoutButton'
import { getProperty } from '@/lib/api/properties'

interface BoostPageProps {
  params: Promise<{ locale: string; id: string }>
}

export default async function PropertyBoostPage({ params }: BoostPageProps) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations('boost')

  const property = await getProperty(id)

  const boostOptions = [
    { days: 3, price: 150 },
    { days: 7, price: 350 },
    { days: 14, price: 600 },
    { days: 30, price: 1000 },
  ]

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        {/* Property Info */}
        <Card className="mb-8 p-6">
          <div className="flex gap-4">
            {property.images[0] && (
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div>
              <h3 className="font-semibold">{property.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {property.community?.name}, {property.community?.emirate}
              </p>
              <p className="mt-1 text-lg font-bold">AED {property.price.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        {/* Boost Options */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">{t('selectDuration')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {boostOptions.map((option) => (
              <Card key={option.days} className="p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{option.days} {t('days')}</h3>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">AED {option.price}</span>
                  </div>
                </div>
                <div className="mb-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {t('featuredBadge')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {t('priorityPlacement')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {t('increasedVisibility')}
                  </div>
                </div>

                <CheckoutButton
                  input={{
                    purpose: 'LISTING_BOOST',
                    propertyId: id,
                    boostDays: option.days,
                  }}
                  variant="default"
                  className="w-full"
                >
                  <CreditCard className="me-2 h-4 w-4" />
                  {t('payWithCard')}
                </CheckoutButton>
              </Card>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <Card className="p-6">
          <h3 className="font-semibold mb-3">{t('howItWorks')}</h3>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>{t('step1')}</li>
            <li>{t('step2')}</li>
            <li>{t('step3')}</li>
            <li>{t('step4')}</li>
          </ol>
        </Card>
      </div>
    </div>
  )
}
