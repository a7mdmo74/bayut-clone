import { vi } from 'vitest'

// Mock Prisma client factory
export function createMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    property: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    agent: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    agency: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    lead: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    favorite: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    savedSearch: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    viewing: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    payment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    refreshToken: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    notification: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    searchLog: {
      create: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    agentReview: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn(),
    },
    agentAvailability: {
      findMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((fns: any[]) => Promise.all(fns)),
    $queryRaw: vi.fn(),
  }
}

// Mock user data
export function mockUser(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'BUYER',
    isActive: true,
    isVerified: true,
    createdAt: new Date(),
    ...overrides,
  }
}

// Mock property data
export function mockProperty(overrides = {}) {
  return {
    id: 'test-property-id',
    title: 'Test Property',
    slug: 'test-property-abc12',
    description: 'A beautiful test property',
    propertyType: 'APARTMENT',
    listingType: 'SALE',
    status: 'ACTIVE',
    price: 1500000,
    bedrooms: 2,
    bathrooms: 2,
    areaSqft: 1200,
    furnished: false,
    ownerId: 'test-user-id',
    agentId: null,
    communityId: null,
    viewsCount: 0,
    isFeatured: false,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    images: [],
    amenities: [],
    community: null,
    ...overrides,
  }
}

// Mock agent data
export function mockAgent(overrides = {}) {
  return {
    id: 'test-agent-id',
    userId: 'test-user-id',
    agencyId: null,
    licenseNo: 'RERA-12345',
    bio: 'Test agent bio',
    languages: ['en', 'ar'],
    leadCredits: 0,
    createdAt: new Date(),
    ...overrides,
  }
}

// Mock request/response helpers
export function mockReq(overrides = {}) {
  return {
    body: {},
    query: {},
    params: {},
    headers: {},
    user: null,
    ip: '127.0.0.1',
    ...overrides,
  } as any
}

export function mockRes() {
  const res: any = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  res.send = vi.fn().mockReturnValue(res)
  return res
}
