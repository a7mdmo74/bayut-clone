import { z } from 'zod'

export const applyForAgentSchema = z.object({
  licenseNo: z.string().min(3).optional(),
  bio: z.string().max(1000).optional(),
  languages: z.array(z.string()).min(1).default(['en']),
  agencyId: z.string().uuid().optional(),
})
export type ApplyForAgentInput = z.infer<typeof applyForAgentSchema>

export const reviewApplicationSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
})
export type ReviewApplicationInput = z.infer<typeof reviewApplicationSchema>
