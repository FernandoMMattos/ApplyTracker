import { ApplicationsTable } from '@/components/applications/applications-table'

export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
        <p className="text-muted-foreground text-sm">Manage and track your job applications.</p>
      </div>

      <ApplicationsTable />
    </div>
  )
}
