'use client'

import { trpc } from '@/lib/trpc/client'
import { ApplicationsOverTime } from '@/components/charts/applications-over-time'
import { StatusFunnel } from '@/components/charts/status-funnel'

function ChartSkeleton() {
  return <div className="bg-card border-border h-64 animate-pulse rounded-lg border" />
}

export function DashboardCharts() {
  const { data, isLoading } = trpc.application.getChartData.useQuery()

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    )
  }

  const hasData = data.byWeek.some((d) => d.count > 0)

  if (!hasData) {
    return (
      <div className="border-border bg-card rounded-lg border p-8 text-center">
        <p className="text-muted-foreground text-sm">Add applications to see charts here.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ApplicationsOverTime data={data.byWeek} />
      <StatusFunnel data={data.byStatus} />
    </div>
  )
}
