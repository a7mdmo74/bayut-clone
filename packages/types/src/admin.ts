import { z } from 'zod'

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
})
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>

// Pure output shapes — backend constructs these
export interface UserDTO {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: string
  isActive: boolean
  isVerified: boolean
  createdAt: string
}

export interface PendingPropertyDTO {
  id: string
  title: string
  slug: string
  status: string
  propertyType: string
  listingType: string
  price: string
  ownerId: string
  owner: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
}
