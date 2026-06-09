import { initTRPC, TRPCError } from '@trpc/server'
import { cache } from 'react'
import superjson from 'superjson'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const createTRPCContext = cache(async () => {
  const session = await auth()
  return { session, db }
})

type Context = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory

export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, session: ctx.session, userId: ctx.session.user.id } })
})
