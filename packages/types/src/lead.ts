import { z } from 'zod'

export const leadStatusSchema = z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED', 'SPAM'])
export type LeadStatus = z.infer<typeof leadStatusSchema>

export const createLeadSchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(7),
  message: z.string().max(1000).optional(),
})
export type CreateLeadInput = z.infer<typeof createLeadSchema>

export const updateLeadStatusSchema = z.object({
  status: leadStatusSchema,
})
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>

// Pure output shape — backend constructs this
export interface LeadDTO {
  id: string
  propertyId: string
  property: {
    id: string
    title: string
    slug: string
  }
  senderId: string | null
  sender: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  name: string
  email: string
  phone: string
  message: string | null
  status: LeadStatus
  createdAt: string
}
