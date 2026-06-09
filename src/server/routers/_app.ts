import { createTRPCRouter } from '@/server/trpc'
import { applicationRouter } from './application'
import { aiRouter } from './ai'

export const appRouter = createTRPCRouter({
  application: applicationRouter,
  ai: aiRouter,
})

export type AppRouter = typeof appRouter
