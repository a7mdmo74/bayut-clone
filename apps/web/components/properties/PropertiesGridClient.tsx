'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PropertyCard, PropertyCardSkeleton } from './PropertCard'
import { PropertyDTO } from '@repo/types'
import { useFavorites } from '@/hooks/useFavorites'
import { clientFetch } from '@/lib/api/client'
import { fadeIn } from '@/lib/motion'

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

  return (
    <AnimatePresence mode='wait'>
      {loading ? (
        <motion.div
          key='skeleton'
          className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'
          variants={fadeIn}
          initial='hidden'
          animate='visible'
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
        >
          {[1, 2, 3, 4, 5, 6].map(i => (
            <PropertyCardSkeleton key={i} />
          ))}
        </motion.div>
      ) : (
        <motion.div
          key='grid'
          className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'
          variants={fadeIn}
          initial='hidden'
          animate='visible'
          transition={{ duration: 0.3 }}
        >
          {properties.map((property, index) => (
            <PropertyCard
              key={property.id}
              property={property}
              isFavorite={isFavorite(property.id)}
              onFavoriteToggle={toggleFavorite}
              index={index}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
