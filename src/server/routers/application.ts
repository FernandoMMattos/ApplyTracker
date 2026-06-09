import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { createApplicationSchema, updateApplicationSchema } from '@/lib/validations/application'

export const applicationRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.application.findMany({
      where: { userId: ctx.userId },
      orderBy: { updatedAt: 'desc' },
      include: { aiInsight: true },
    })
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const application = await ctx.db.application.findUnique({
      where: { id: input.id, userId: ctx.userId },
      include: { aiInsight: true },
    })
    if (!application) throw new TRPCError({ code: 'NOT_FOUND' })
    return application
  }),

  create: protectedProcedure.input(createApplicationSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.application.create({
      data: { ...input, userId: ctx.userId },
    })
  }),

  update: protectedProcedure.input(updateApplicationSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input
    const existing = await ctx.db.application.findUnique({ where: { id, userId: ctx.userId } })
    if (!existing) throw new TRPCError({ code: 'NOT_FOUND' })
    return ctx.db.application.update({ where: { id }, data })
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.application.findUnique({
        where: { id: input.id, userId: ctx.userId },
      })
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' })
      return ctx.db.application.delete({ where: { id: input.id } })
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const applications = await ctx.db.application.findMany({
      where: { userId: ctx.userId },
      select: { status: true, createdAt: true },
    })

    const total = applications.length
    const byStatus = applications.reduce<Record<string, number>>((acc, app) => {
      acc[app.status] = (acc[app.status] ?? 0) + 1
      return acc
    }, {})

    const applied = byStatus['APPLIED'] ?? 0
    const interviews = (byStatus['PHONE_SCREEN'] ?? 0) + (byStatus['INTERVIEW'] ?? 0)
    const offers = byStatus['OFFER'] ?? 0
    const responseRate = applied > 0 ? Math.round((interviews / applied) * 100) : 0

    return { total, byStatus, responseRate, offers }
  }),

  getChartData: protectedProcedure.query(async ({ ctx }) => {
    const applications = await ctx.db.application.findMany({
      where: { userId: ctx.userId },
      select: { status: true, createdAt: true },
    })

    const now = new Date()
    const byWeek = Array.from({ length: 12 }, (_, i) => {
      const weekEnd = new Date(now)
      weekEnd.setDate(now.getDate() - (11 - i) * 7)
      weekEnd.setHours(23, 59, 59, 999)
      const weekStart = new Date(weekEnd)
      weekStart.setDate(weekEnd.getDate() - 6)
      weekStart.setHours(0, 0, 0, 0)

      const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const count = applications.filter(
        (a) => a.createdAt >= weekStart && a.createdAt <= weekEnd,
      ).length
      return { week: label, count }
    })

    const STATUS_ORDER = [
      'SAVED',
      'APPLIED',
      'PHONE_SCREEN',
      'INTERVIEW',
      'OFFER',
      'REJECTED',
      'WITHDRAWN',
    ] as const
    const STATUS_LABELS: Record<string, string> = {
      SAVED: 'Saved',
      APPLIED: 'Applied',
      PHONE_SCREEN: 'Phone Screen',
      INTERVIEW: 'Interview',
      OFFER: 'Offer',
      REJECTED: 'Rejected',
      WITHDRAWN: 'Withdrawn',
    }

    const byStatus = STATUS_ORDER.map((status) => ({
      status,
      label: STATUS_LABELS[status],
      count: applications.filter((a) => a.status === status).length,
    }))

    return { byWeek, byStatus }
  }),
})
