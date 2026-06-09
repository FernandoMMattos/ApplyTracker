'use client'

import { ExternalLinkIcon, CalendarIcon, MapPinIcon, BanknoteIcon } from 'lucide-react'
import type { Application, AiInsight } from '@prisma/client'

import { trpc } from '@/lib/trpc/client'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { StatusBadge } from './status-badge'
import { AiInsightsPanel } from './ai-insights-panel'

type ApplicationWithInsight = Application & { aiInsight: AiInsight | null }

type Props = {
  applicationId: string | null
  onOpenChange: (open: boolean) => void
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <div>
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  )
}

function formatDate(date: Date | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function ApplicationSheet({ applicationId, onOpenChange }: Props) {
  const utils = trpc.useUtils()

  const { data: application } = trpc.application.getById.useQuery(
    { id: applicationId! },
    { enabled: !!applicationId },
  )

  const handleInsightGenerated = () => {
    void utils.application.getById.invalidate({ id: applicationId! })
    void utils.application.getAll.invalidate()
  }

  return (
    <Sheet open={!!applicationId} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {application ? (
          <>
            <SheetHeader className="pr-8">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <SheetTitle>{application.company}</SheetTitle>
                  <SheetDescription>{application.role}</SheetDescription>
                </div>
                <StatusBadge status={application.status} />
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-6 p-4">
              {/* Details */}
              <div className="grid grid-cols-2 gap-3">
                {application.location && (
                  <Detail icon={MapPinIcon} label="Location" value={application.location} />
                )}
                {application.salary && (
                  <Detail icon={BanknoteIcon} label="Salary" value={application.salary} />
                )}
                <Detail
                  icon={CalendarIcon}
                  label="Applied"
                  value={formatDate(application.appliedAt)}
                />
                {application.deadline && (
                  <Detail
                    icon={CalendarIcon}
                    label="Deadline"
                    value={formatDate(application.deadline)}
                  />
                )}
              </div>

              {application.jobUrl && (
                <a
                  href={application.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-1.5 text-sm hover:underline"
                >
                  <ExternalLinkIcon className="size-3.5" />
                  View job posting
                </a>
              )}

              {application.notes && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {application.notes}
                  </p>
                </div>
              )}

              <div className="border-t pt-2">
                <AiInsightsPanel
                  applicationId={application.id}
                  insight={(application as ApplicationWithInsight).aiInsight}
                  onInsightGenerated={handleInsightGenerated}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground text-sm">Loading…</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
