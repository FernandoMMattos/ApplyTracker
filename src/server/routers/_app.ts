import { createTRPCRouter } from '@/server/trpc'
import { applicationRouter } from './application'

export const appRouter = createTRPCRouter({
  application: applicationRouter,
})

export type AppRouter = typeof appRouter
