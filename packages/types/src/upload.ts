import { z } from 'zod'

export const presignUploadSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
})
export type PresignUploadInput = z.infer<typeof presignUploadSchema>
