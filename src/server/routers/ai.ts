import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { anthropic } from '@/lib/ai'

export const aiRouter = createTRPCRouter({
  parseJob: protectedProcedure
    .input(
      z.object({
        jobText: z
          .string()
          .min(50, 'Please paste at least 50 characters of the job description')
          .max(15000),
      }),
    )
    .mutation(async ({ input }) => {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        tools: [
          {
            name: 'set_job_details',
            description: 'Extract structured job details from a job description.',
            input_schema: {
              type: 'object' as const,
              properties: {
                company: { type: 'string', description: 'Company name' },
                role: { type: 'string', description: 'Job title / role' },
                location: {
                  type: 'string',
                  description: 'Location or "Remote". Omit if not mentioned.',
                },
                salary: {
                  type: 'string',
                  description:
                    'Salary range as written (e.g. "$120k–$150k"). Omit if not mentioned.',
                },
                notes: {
                  type: 'string',
                  description:
                    'A 2–3 sentence summary of the key requirements and what makes this role interesting.',
                },
              },
              required: ['company', 'role'],
            },
          },
        ],
        tool_choice: { type: 'tool', name: 'set_job_details' },
        messages: [
          {
            role: 'user',
            content: `Extract the job details from this job description:\n\n${input.jobText}`,
          },
        ],
      })

      const toolUse = response.content.find((block) => block.type === 'tool_use')
      if (!toolUse || toolUse.type !== 'tool_use') {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to parse job description',
        })
      }

      return toolUse.input as {
        company: string
        role: string
        location?: string
        salary?: string
        notes?: string
      }
    }),

  generateInsights: protectedProcedure
    .input(z.object({ applicationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const application = await ctx.db.application.findUnique({
        where: { id: input.applicationId, userId: ctx.userId },
      })
      if (!application) throw new TRPCError({ code: 'NOT_FOUND' })

      const context = [
        `Company: ${application.company}`,
        `Role: ${application.role}`,
        application.location ? `Location: ${application.location}` : null,
        application.salary ? `Salary: ${application.salary}` : null,
        application.notes ? `Job notes: ${application.notes}` : null,
        `Current status: ${application.status}`,
      ]
        .filter(Boolean)
        .join('\n')

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        tools: [
          {
            name: 'set_insights',
            description: 'Provide structured analysis and coaching for a job application.',
            input_schema: {
              type: 'object' as const,
              properties: {
                summary: {
                  type: 'string',
                  description: 'A 1–2 sentence summary of what this opportunity looks like.',
                },
                fitScore: {
                  type: 'number',
                  description:
                    'An estimated fit score from 0–100 based on what we know. Be honest and nuanced.',
                },
                suggestions: {
                  type: 'array',
                  items: { type: 'string' },
                  description:
                    '3–5 specific, actionable suggestions for this candidate to improve their chances.',
                },
                coverLetterDraft: {
                  type: 'string',
                  description:
                    'A professional, compelling cover letter draft that is specific to this role. Use placeholder text like [Your Name] where personal details would go.',
                },
              },
              required: ['summary', 'fitScore', 'suggestions', 'coverLetterDraft'],
            },
          },
        ],
        tool_choice: { type: 'tool', name: 'set_insights' },
        messages: [
          {
            role: 'user',
            content: `You are a career coach providing honest, actionable feedback.\n\nAnalyze this job application and provide insights:\n\n${context}`,
          },
        ],
      })

      const toolUse = response.content.find((block) => block.type === 'tool_use')
      if (!toolUse || toolUse.type !== 'tool_use') {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate insights',
        })
      }

      const result = toolUse.input as {
        summary: string
        fitScore: number
        suggestions: string[]
        coverLetterDraft: string
      }

      const insight = await ctx.db.aiInsight.upsert({
        where: { applicationId: input.applicationId },
        update: {
          summary: result.summary,
          fitScore: Math.round(result.fitScore),
          suggestions: result.suggestions,
          coverLetterDraft: result.coverLetterDraft,
        },
        create: {
          applicationId: input.applicationId,
          summary: result.summary,
          fitScore: Math.round(result.fitScore),
          suggestions: result.suggestions,
          coverLetterDraft: result.coverLetterDraft,
        },
      })

      return insight
    }),
})
