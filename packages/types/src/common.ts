import { z } from 'zod'

// Reusable building blocks other schemas can compose with
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})
export type PaginationQuery = z.infer<typeof paginationQuerySchema>

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Generic wrapper — kept as a plain interface since it's pure *output*
// shape and TS generics don't map cleanly onto z.infer for wrappers like this
export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface ApiError {
  error: string
  message?: string
}
