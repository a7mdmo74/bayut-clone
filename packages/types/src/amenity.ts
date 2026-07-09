import { z } from 'zod'

export const createAmenitySchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().optional(),
})
export type CreateAmenityInput = z.infer<typeof createAmenitySchema>

// Pure output shape — backend constructs this
export interface AmenityDTO {
  id: string
  name: string
  icon: string | null
}
