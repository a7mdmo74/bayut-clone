import { setRequestLocale } from 'next-intl/server'
import { BuyerDashboardContent } from '../BuyerDashboardContent'
import {
  getCurrentUser,
  getUserFavorites,
  getUserSavedSearches,
  getUserInquiries,
} from '@/lib/api/user-server'

export const dynamic = 'force-dynamic'

export default async function FavoritesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const [user, favoritesResponse, savedSearches, inquiries] = await Promise.all([
    getCurrentUser().catch(() => null),
    getUserFavorites().catch(() => null),
    getUserSavedSearches().catch(() => []),
    getUserInquiries().catch(() => []),
  ])

  const favorites = favoritesResponse?.data?.map(favorite => favorite.property) ?? []
  const userName = user?.firstName ?? 'there'

  return (
    <BuyerDashboardContent
      userName={userName}
      favorites={favorites}
      savedSearches={savedSearches ?? []}
      inquiries={inquiries ?? []}
      reservations={[]}
      defaultTab='favorites'
    />
  )
}
