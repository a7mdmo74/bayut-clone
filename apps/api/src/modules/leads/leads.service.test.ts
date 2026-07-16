import { describe, it, expect, vi } from 'vitest'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    property: {
      findUnique: vi.fn(),
    },
    lead: {
      create: vi.fn().mockResolvedValue({ id: 'lead-1', name: 'Test', email: 'a@b.com', phone: '123', message: 'Hi', status: 'NEW', createdAt: new Date() }),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}))

vi.mock('../../lib/prisma', () => ({ prisma: mockPrisma }))
vi.mock('../../lib/email', () => ({ sendNewLeadEmail: vi.fn().mockResolvedValue(undefined) }))

import * as leadsService from './leads.service'

describe('Leads Service', () => {
  it('createLead should throw 404 if property not found', async () => {
    mockPrisma.property.findUnique.mockResolvedValue(null)
    await expect(
      leadsService.createLead({ propertyId: 'none', name: 'T', email: 'a@b.com', phone: '123' })
    ).rejects.toThrow('not found')
  })

  it('getLeadsForAgent should return leads array', async () => {
    const result = await leadsService.getLeadsForAgent('agent-1', 'AGENT')
    expect(result).toHaveProperty('leads')
    expect(Array.isArray(result.leads)).toBe(true)
  })
})
