import { describe, it, expect, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import type { Session } from 'next-auth'

vi.mock('@/lib/db', () => ({ db: {} }))
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))

import { createCallerFactory } from '@/server/trpc'
import { applicationRouter } from '@/server/routers/application'

const createCaller = createCallerFactory(applicationRouter)

const mockSession: Session = {
  user: { id: 'user-1', name: 'Test User', email: 'test@example.com', image: null },
  expires: '2099-12-31T00:00:00.000Z',
}

function makeCaller(applicationMethods: Record<string, unknown> = {}) {
  return createCaller({
    session: mockSession,
    db: { application: applicationMethods } as unknown as PrismaClient,
  })
}

function makeUnauthCaller() {
  return createCaller({ session: null, db: {} as unknown as PrismaClient })
}

describe('application.getStats', () => {
  it('returns zeros when there are no applications', async () => {
    const caller = makeCaller({ findMany: vi.fn().mockResolvedValue([]) })
    const stats = await caller.getStats()
    expect(stats.total).toBe(0)
    expect(stats.responseRate).toBe(0)
    expect(stats.offers).toBe(0)
    expect(stats.byStatus).toEqual({})
  })

  it('calculates responseRate as (phone screens + interviews) / applied × 100', async () => {
    const apps = [
      { status: 'APPLIED', createdAt: new Date() },
      { status: 'APPLIED', createdAt: new Date() },
      { status: 'PHONE_SCREEN', createdAt: new Date() },
      { status: 'INTERVIEW', createdAt: new Date() },
      { status: 'OFFER', createdAt: new Date() },
    ]
    const caller = makeCaller({ findMany: vi.fn().mockResolvedValue(apps) })
    const stats = await caller.getStats()
    expect(stats.total).toBe(5)
    expect(stats.responseRate).toBe(100) // 2 responses / 2 applied = 100%
    expect(stats.offers).toBe(1)
  })

  it('rounds responseRate to the nearest integer', async () => {
    const apps = [
      { status: 'APPLIED', createdAt: new Date() },
      { status: 'APPLIED', createdAt: new Date() },
      { status: 'APPLIED', createdAt: new Date() },
      { status: 'PHONE_SCREEN', createdAt: new Date() },
    ]
    const caller = makeCaller({ findMany: vi.fn().mockResolvedValue(apps) })
    const stats = await caller.getStats()
    expect(stats.responseRate).toBe(33) // 1/3 = 33.3% → 33
  })

  it('returns responseRate of 0 when no applications are in APPLIED status', async () => {
    const apps = [{ status: 'SAVED', createdAt: new Date() }]
    const caller = makeCaller({ findMany: vi.fn().mockResolvedValue(apps) })
    const stats = await caller.getStats()
    expect(stats.responseRate).toBe(0)
  })

  it('throws UNAUTHORIZED when there is no session', async () => {
    const caller = makeUnauthCaller()
    await expect(caller.getStats()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })
})

describe('application.getChartData', () => {
  it('always returns exactly 12 week buckets', async () => {
    const caller = makeCaller({ findMany: vi.fn().mockResolvedValue([]) })
    const { byWeek } = await caller.getChartData()
    expect(byWeek).toHaveLength(12)
  })

  it('returns all buckets with a count when there are no applications', async () => {
    const caller = makeCaller({ findMany: vi.fn().mockResolvedValue([]) })
    const { byWeek } = await caller.getChartData()
    expect(byWeek.every((b) => b.count === 0)).toBe(true)
  })

  it('counts an application created today in the last bucket', async () => {
    const apps = [{ status: 'APPLIED', createdAt: new Date() }]
    const caller = makeCaller({ findMany: vi.fn().mockResolvedValue(apps) })
    const { byWeek } = await caller.getChartData()
    expect(byWeek[byWeek.length - 1].count).toBe(1)
  })

  it('returns exactly 7 status entries in byStatus', async () => {
    const caller = makeCaller({ findMany: vi.fn().mockResolvedValue([]) })
    const { byStatus } = await caller.getChartData()
    expect(byStatus).toHaveLength(7)
  })

  it('includes all 7 pipeline statuses in order', async () => {
    const caller = makeCaller({ findMany: vi.fn().mockResolvedValue([]) })
    const { byStatus } = await caller.getChartData()
    const statuses = byStatus.map((b) => b.status)
    expect(statuses).toEqual([
      'SAVED',
      'APPLIED',
      'PHONE_SCREEN',
      'INTERVIEW',
      'OFFER',
      'REJECTED',
      'WITHDRAWN',
    ])
  })

  it('counts applications by status correctly', async () => {
    const apps = [
      { status: 'APPLIED', createdAt: new Date() },
      { status: 'APPLIED', createdAt: new Date() },
      { status: 'INTERVIEW', createdAt: new Date() },
    ]
    const caller = makeCaller({ findMany: vi.fn().mockResolvedValue(apps) })
    const { byStatus } = await caller.getChartData()
    expect(byStatus.find((b) => b.status === 'APPLIED')!.count).toBe(2)
    expect(byStatus.find((b) => b.status === 'INTERVIEW')!.count).toBe(1)
    expect(byStatus.find((b) => b.status === 'SAVED')!.count).toBe(0)
  })
})

describe('application.getById', () => {
  it('throws NOT_FOUND when the application does not exist', async () => {
    const caller = makeCaller({ findUnique: vi.fn().mockResolvedValue(null) })
    await expect(caller.getById({ id: 'nonexistent' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })

  it('throws UNAUTHORIZED when there is no session', async () => {
    const caller = makeUnauthCaller()
    await expect(caller.getById({ id: 'app-1' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })
})

describe('application.delete', () => {
  it('throws NOT_FOUND when the application does not exist', async () => {
    const caller = makeCaller({ findUnique: vi.fn().mockResolvedValue(null) })
    await expect(caller.delete({ id: 'nonexistent' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })
})
