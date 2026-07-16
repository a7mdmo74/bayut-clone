import { describe, it, expect, vi } from 'vitest'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    property: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    agent: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}))

vi.mock('../../lib/prisma', () => ({ prisma: mockPrisma }))
vi.mock('../../lib/email', () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }))
vi.mock('../analytics/analytics.service', () => ({ logSearch: vi.fn().mockResolvedValue(undefined) }))

import * as propertiesService from './properties.service'

describe('Properties Service', () => {
  describe('createProperty', () => {
    it('should create property', async () => {
      mockPrisma.property.findFirst.mockResolvedValue(null)
      mockPrisma.property.create.mockResolvedValue({
        id: 'p1', title: 'Test', slug: 'test-abc12',
        propertyType: 'APARTMENT', listingType: 'SALE', status: 'ACTIVE', price: 1500000,
        images: [], amenities: [], community: null, createdAt: new Date(),
      })

      const result = await propertiesService.createProperty('owner-id', {
        title: 'Test Property',
        description: 'A beautiful property with at least twenty characters for validation',
        propertyType: 'APARTMENT', listingType: 'SALE', price: 1500000,
      })

      expect(result).toHaveProperty('slug')
      expect(mockPrisma.property.create).toHaveBeenCalled()
    })
  })

  describe('getPropertyBySlug', () => {
    it('should throw 404 if not found', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(null)
      await expect(propertiesService.getPropertyBySlug('none')).rejects.toThrow('not found')
    })

    it('should return property', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'p1', title: 'Test', slug: 'test', propertyType: 'APARTMENT',
        listingType: 'SALE', status: 'ACTIVE', price: 1000000,
        images: [], amenities: [], community: null, agent: null, createdAt: new Date(),
      })
      const result = await propertiesService.getPropertyBySlug('test')
      expect(result.title).toBe('Test')
    })
  })

  describe('searchProperties', () => {
    it('should return paginated results', async () => {
      mockPrisma.property.findMany.mockResolvedValue([{
        id: 'p1', title: 'Test', slug: 'test', propertyType: 'APARTMENT',
        listingType: 'SALE', status: 'ACTIVE', price: 1000000,
        images: [], community: null, createdAt: new Date(),
      }])
      mockPrisma.property.count.mockResolvedValue(1)

      const result = await propertiesService.searchProperties({ listingType: 'SALE' }, { page: 1, limit: 12 })
      expect(result.data).toHaveLength(1)
      expect(result.meta.total).toBe(1)
    })
  })
})
