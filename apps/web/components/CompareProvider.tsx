'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface CompareProperty {
  id: string
  title: string
  slug: string
  price: number
  propertyType: string
  listingType: string
  bedrooms: number | null
  bathrooms: number | null
  areaSqft: number | null
  community: { name: string; emirate: string } | null
  images: string[]
}

interface CompareContextValue {
  items: CompareProperty[]
  add: (property: CompareProperty) => void
  remove: (id: string) => void
  clear: () => void
  has: (id: string) => boolean
}

const CompareContext = createContext<CompareContextValue | null>(null)

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareProperty[]>([])

  const add = useCallback((property: CompareProperty) => {
    setItems(prev => {
      if (prev.length >= 4) return prev // max 4 properties
      if (prev.some(p => p.id === property.id)) return prev
      return [...prev, property]
    })
  }, [])

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(p => p.id !== id))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const has = useCallback((id: string) => items.some(p => p.id === id), [items])

  return (
    <CompareContext.Provider value={{ items, add, remove, clear, has }}>
      {children}
    </CompareContext.Provider>
  )
}

export function useCompare() {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error('useCompare must be used within CompareProvider')
  return ctx
}
