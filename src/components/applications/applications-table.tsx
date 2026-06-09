'use client'

import { useState, useMemo } from 'react'
import { PencilIcon, Trash2Icon, PlusIcon, SearchIcon, DownloadIcon } from 'lucide-react'
import type { Application, AiInsight, ApplicationStatus } from '@prisma/client'

import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from './status-badge'
import { ApplicationDialog } from './application-dialog'
import { ApplicationSheet } from './application-sheet'
import { DeleteDialog } from './delete-dialog'

type ApplicationWithInsight = Application & { aiInsight: AiInsight | null }

const STATUS_FILTER_OPTIONS: { value: ApplicationStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'SAVED', label: 'Saved' },
  { value: 'APPLIED', label: 'Applied' },
  { value: 'PHONE_SCREEN', label: 'Phone Screen' },
  { value: 'INTERVIEW', label: 'Interview' },
  { value: 'OFFER', label: 'Offer' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
]

function formatDate(date: Date | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function ApplicationsTable() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [editApplication, setEditApplication] = useState<ApplicationWithInsight | null>(null)
  const [deleteApplication, setDeleteApplication] = useState<Application | null>(null)

  const { data: applications, isLoading } = trpc.application.getAll.useQuery()

  const filtered = useMemo(() => {
    if (!applications) return []
    let result = applications
    if (statusFilter !== 'ALL') {
      result = result.filter((a) => a.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) => a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q),
      )
    }
    return result
  }, [applications, search, statusFilter])

  function handleExport() {
    window.open('/api/export', '_blank')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search by company or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ApplicationStatus | 'ALL')}
        >
          <SelectTrigger className="w-36 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button variant="outline" size="sm" onClick={handleExport} aria-label="Export CSV">
            <DownloadIcon />
            Export CSV
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            Add Application
          </Button>
        </div>
      </div>

      <div className="bg-card border-border rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-12 text-center text-sm">
                  Loading…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-12 text-center text-sm">
                  {search || statusFilter !== 'ALL'
                    ? 'No applications match your filters.'
                    : 'No applications yet. Add your first one!'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((application) => (
                <TableRow
                  key={application.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedAppId(application.id)}
                >
                  <TableCell className="font-medium">{application.company}</TableCell>
                  <TableCell className="text-muted-foreground">{application.role}</TableCell>
                  <TableCell>
                    <StatusBadge status={application.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {application.location ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(application.appliedAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(application.updatedAt)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditApplication(application)}
                        aria-label="Edit application"
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteApplication(application)}
                        aria-label="Delete application"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {applications && applications.length > 0 && (
        <p className="text-muted-foreground text-right text-xs">
          {filtered.length} of {applications.length} application
          {applications.length !== 1 ? 's' : ''}
        </p>
      )}

      <ApplicationSheet
        applicationId={selectedAppId}
        onOpenChange={(open) => {
          if (!open) setSelectedAppId(null)
        }}
      />

      <ApplicationDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ApplicationDialog
        open={!!editApplication}
        onOpenChange={(open) => {
          if (!open) setEditApplication(null)
        }}
        application={editApplication ?? undefined}
      />

      <DeleteDialog
        open={!!deleteApplication}
        onOpenChange={(open) => {
          if (!open) setDeleteApplication(null)
        }}
        application={deleteApplication}
      />
    </div>
  )
}
