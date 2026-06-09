'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

type DataPoint = { status: string; label: string; count: number }

const STATUS_COLORS: Record<string, string> = {
  SAVED: '#94a3b8',
  APPLIED: '#3b82f6',
  PHONE_SCREEN: '#eab308',
  INTERVIEW: '#f97316',
  OFFER: '#22c55e',
  REJECTED: '#ef4444',
  WITHDRAWN: '#cbd5e1',
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: DataPoint; value: number }[]
}) {
  if (!active || !payload?.length) return null
  const { label, count } = payload[0].payload
  return (
    <div className="bg-popover border-border rounded-lg border px-3 py-2 shadow-md">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-sm font-semibold">
        {count} {count === 1 ? 'application' : 'applications'}
      </p>
    </div>
  )
}

export function StatusFunnel({ data }: { data: DataPoint[] }) {
  return (
    <div className="bg-card border-border rounded-lg border p-5">
      <p className="mb-4 text-sm font-medium">Pipeline by Status</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
