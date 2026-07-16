import { z } from 'zod'
import { propertySearchQuerySchema } from './property'

export const createSavedSearchSchema = z.object({
  name: z.string().min(1).max(100),
  filters: propertySearchQuerySchema,
})
export type CreateSavedSearchInput = z.infer<typeof createSavedSearchSchema>

// Pure output shape — backend constructs this
export interface SavedSearchDTO {
  id: string
  name: string
  filters: unknown
  alertsOn: boolean
  createdAt: string
}
