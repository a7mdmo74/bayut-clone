import { describe, it, expect, vi } from 'vitest'

const { mockPrisma, mockHashPassword, mockComparePassword, mockSignAccessToken, mockSignRefreshToken } = vi.hoisted(() => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    refreshToken: {
      create: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
  }
  return {
    mockPrisma,
    mockHashPassword: vi.fn().mockResolvedValue('hashed-password'),
    mockComparePassword: vi.fn(),
    mockSignAccessToken: vi.fn().mockReturnValue('mock-access-token'),
    mockSignRefreshToken: vi.fn().mockReturnValue('mock-refresh-token'),
  }
})

vi.mock('../../lib/prisma', () => ({ prisma: mockPrisma }))
vi.mock('./password.util', () => ({
  hashPassword: mockHashPassword,
  comparePassword: mockComparePassword,
}))
vi.mock('./token.util', () => ({
  signAccessToken: mockSignAccessToken,
  signRefreshToken: mockSignRefreshToken,
  verifyRefreshToken: vi.fn(),
}))
vi.mock('../../lib/email', () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }))
vi.mock('../../config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long-for-validation',
    JWT_REFRESH_SECRET: 'test-refresh-secret-that-is-at-least-32-chars',
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',
    FRONTEND_URL: 'http://localhost:3000',
    NODE_ENV: 'test',
  },
}))

import * as authService from './auth.service'

describe('Auth Service', () => {
  describe('registerUser', () => {
    it('should throw 409 if email exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' })
      await expect(
        authService.registerUser({ email: 'test@example.com', password: 'pass1234', firstName: 'T', lastName: 'U' })
      ).rejects.toThrow('already exists')
    })

    it('should create user and return tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue({ id: 'new-id', role: 'BUYER' })

      const result = await authService.registerUser({
        email: 'new@example.com', password: 'pass1234', firstName: 'N', lastName: 'U',
      })

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(mockPrisma.user.create).toHaveBeenCalled()
    })
  })

  describe('loginUser', () => {
    it('should throw 401 if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)
      await expect(
        authService.loginUser({ email: 'no@example.com', password: 'pass1234' })
      ).rejects.toThrow('Invalid email or password')
    })

    it('should throw 401 if password wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', password: 'hashed', role: 'BUYER' })
      mockComparePassword.mockResolvedValue(false)
      await expect(
        authService.loginUser({ email: 'a@b.com', password: 'wrong' })
      ).rejects.toThrow('Invalid email or password')
    })

    it('should return tokens on valid login', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', password: 'hashed', role: 'BUYER' })
      mockComparePassword.mockResolvedValue(true)
      const result = await authService.loginUser({ email: 'a@b.com', password: 'correct' })
      expect(result).toHaveProperty('accessToken')
    })
  })

  describe('getCurrentUser', () => {
    it('should throw 404 if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)
      await expect(authService.getCurrentUser('none')).rejects.toThrow('User not found')
    })

    it('should return user data', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'BUYER' })
      const result = await authService.getCurrentUser('u1')
      expect(result).toHaveProperty('id', 'u1')
      expect(result).toHaveProperty('email', 'a@b.com')
    })
  })
})
