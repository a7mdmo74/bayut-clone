import { vi } from 'vitest'

// Suppress noisy logs in tests
vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))
