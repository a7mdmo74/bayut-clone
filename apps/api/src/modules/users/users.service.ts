import { prisma } from '../../lib/prisma'
import { AppError } from '../../utils/AppError'
import { hashPassword, comparePassword } from '../auth/password.util'
import type { UpdateProfileInput, ChangePasswordInput } from '@repo/types'

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
    }
  })

  if (!user) throw new AppError(404, 'User not found')
  return user
}

export async function updateUserProfile(userId: string, input: UpdateProfileInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, 'User not found')

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
    }
  })

  return updatedUser
}

export async function changeUserPassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, 'User not found')

  const isValidPassword = await comparePassword(input.currentPassword, user.password)
  if (!isValidPassword) {
    throw new AppError(400, 'Current password is incorrect')
  }

  const hashedPassword = await hashPassword(input.newPassword)

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  })
}