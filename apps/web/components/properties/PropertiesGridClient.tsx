'use client'

import { useState, useEffect } from 'react'
import { PropertyCard } from './PropertCard'
import { PropertyDTO } from '@repo/types'
import { useFavorites } from '@/hooks/useFavorites'
import { clientFetch } from '@/lib/api/client'

interface PropertiesGridClientProps {
  properties?: PropertyDTO[]
}

export function PropertiesGridClient({ properties: initialProperties }: PropertiesGridClientProps = {}) {
  const [properties, setProperties] = useState<PropertyDTO[]>(initialProperties || [])
  const [loading, setLoading] = useState(!initialProperties)
  const { isFavorite, toggleFavorite, isLoading } = useFavorites()

  useEffect(() => {
    if (!initialProperties) {
      async function fetchProperties() {
        try {
          const data = await clientFetch<PropertyDTO[]>('/properties/featured?limit=6')
          if (data) {
            setProperties(data)
          }
        } catch (error) {
          console.error('Failed to fetch properties:', error)
        } finally {
          setLoading(false)
        }
      }
      fetchProperties()
    }
  }, [initialProperties])

  if (loading) {
    return <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>Loading...</div>
  }

  return (
    <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
      {properties.map(property => (
        <PropertyCard
          key={property.id}
          property={property}
          isFavorite={isFavorite(property.id)}
          onFavoriteToggle={toggleFavorite}
        />
      ))}
    </div>
  )
}
