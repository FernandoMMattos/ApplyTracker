'use client'

import { useState, useMemo } from 'react'
import { PencilIcon, Trash2Icon, PlusIcon, SearchIcon } from 'lucide-react'
import type { Application, AiInsight } from '@prisma/client'

import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [editApplication, setEditApplication] = useState<ApplicationWithInsight | null>(null)
  const [deleteApplication, setDeleteApplication] = useState<Application | null>(null)

  const { data: applications, isLoading } = trpc.application.getAll.useQuery()

  const filtered = useMemo(() => {
    if (!applications) return []
    if (!search.trim()) return applications
    const q = search.toLowerCase()
    return applications.filter(
      (a) => a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q),
    )
  }, [applications, search])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search by company or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon />
          Add Application
        </Button>
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
                  {search
                    ? 'No applications match your search.'
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
