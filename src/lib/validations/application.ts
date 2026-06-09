import { z } from 'zod'

export const applicationStatusSchema = z.enum([
  'SAVED',
  'APPLIED',
  'PHONE_SCREEN',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
])

export const createApplicationSchema = z.object({
  company: z.string().min(1, 'Company is required').max(100),
  role: z.string().min(1, 'Role is required').max(100),
  status: applicationStatusSchema.default('SAVED'),
  jobUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  location: z.string().max(100).optional(),
  salary: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
  appliedAt: z.date().optional(),
  deadline: z.date().optional(),
})

export const updateApplicationSchema = createApplicationSchema.partial().extend({
  id: z.string(),
})

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>
