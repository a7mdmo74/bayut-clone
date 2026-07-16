import { setRequestLocale } from 'next-intl/server'
import { BuyerDashboardContent } from './BuyerDashboardContent'
import {
  getCurrentUser,
  getUserFavorites,
  getUserSavedSearches,
  getUserInquiries,
} from '@/lib/api/user-server'
import { getPaymentHistory } from '@/lib/api/payments-server'

export const dynamic = 'force-dynamic'

export default async function BuyerDash({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const [user, favoritesResponse, savedSearches, inquiries, paymentsResponse] = await Promise.all([
    getCurrentUser().catch(() => null),
    getUserFavorites().catch(() => null),
    getUserSavedSearches().catch(() => []),
    getUserInquiries().catch(() => []),
    getPaymentHistory({ page: 1, limit: 50 }).catch(() => null),
  ])

  const favorites = favoritesResponse?.data?.map(favorite => favorite.property) ?? []
  const reservations =
    paymentsResponse?.data?.filter(payment => payment.purpose === 'PROPERTY_RESERVATION') ?? []
  const userName = user?.firstName ?? 'there'

  return (
    <BuyerDashboardContent
      userName={userName}
      favorites={favorites}
      savedSearches={savedSearches ?? []}
      inquiries={inquiries ?? []}
      reservations={reservations}
    />
  )
}
