'use client'

import { useEffect, useState } from 'react'
import { getUserFavorites } from '@/lib/api/user'
import type { PropertyDTO } from '@repo/types'

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadFavorites() {
      try {
        const response = await getUserFavorites()
        if (response?.data) {
          const ids = new Set(response.data.map(fav => fav.propertyId))
          setFavoriteIds(ids)
        }
      } catch (error) {
        console.error('Failed to load favorites:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFavorites()
  }, [])

  const isFavorite = (propertyId: string) => favoriteIds.has(propertyId)

  const toggleFavorite = (propertyId: string, isNowFavorite: boolean) => {
    setFavoriteIds(prev => {
      const newSet = new Set(prev)
      if (isNowFavorite) {
        newSet.add(propertyId)
      } else {
        newSet.delete(propertyId)
      }
      return newSet
    })
  }

  const addFavoriteId = (propertyId: string) => toggleFavorite(propertyId, true)
  const removeFavoriteId = (propertyId: string) => toggleFavorite(propertyId, false)

  return {
    favoriteIds,
    isFavorite,
    toggleFavorite,
    addFavoriteId,
    removeFavoriteId,
    isLoading,
  }
}

export function useFavoriteProperties(initialFavorites: PropertyDTO[] = []) {
  const [favorites, setFavorites] = useState(initialFavorites)

  useEffect(() => {
    setFavorites(initialFavorites)
  }, [initialFavorites])

  const handleFavoriteToggle = (propertyId: string, isNowFavorite: boolean) => {
    if (!isNowFavorite) {
      setFavorites(prev => prev.filter(property => property.id !== propertyId))
    }
  }

  return { favorites, handleFavoriteToggle }
}
