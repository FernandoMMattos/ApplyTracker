import { api } from '@/lib/trpc/server'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'

export default async function DashboardPage() {
  const stats = await api.application.getStats()

  const statCards = [
    { label: 'Total Applications', value: stats.total },
    {
      label: 'Interviews',
      value: (stats.byStatus['PHONE_SCREEN'] ?? 0) + (stats.byStatus['INTERVIEW'] ?? 0),
    },
    { label: 'Offers', value: stats.offers },
    { label: 'Response Rate', value: `${stats.responseRate}%` },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Your job search at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value }) => (
          <div key={label} className="bg-card border-border rounded-lg border p-5">
            <p className="text-muted-foreground text-sm">{label}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <DashboardCharts />
    </div>
  )
}
