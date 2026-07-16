import { describe, it, expect, vi } from 'vitest'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    property: {
      findUnique: vi.fn(),
    },
    favorite: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}))

vi.mock('../../lib/prisma', () => ({ prisma: mockPrisma }))

import * as favoritesService from './favorites.service'

describe('Favorites Service', () => {
  it('addFavorite should throw 404 if property not found', async () => {
    mockPrisma.property.findUnique.mockResolvedValueOnce(null)
    await expect(favoritesService.addFavorite('u1', 'none')).rejects.toThrow('not found')
  })

  it('getUserFavorites should return empty list', async () => {
    const result = await favoritesService.getUserFavorites('u1', 1, 12)
    expect(result).toHaveProperty('data')
    expect(result.data).toEqual([])
  })
})
