import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ApplicationStatus } from '@prisma/client'

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; className: string }> = {
  SAVED: {
    label: 'Saved',
    className: 'bg-muted text-muted-foreground border-border',
  },
  APPLIED: {
    label: 'Applied',
    className:
      'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400 dark:bg-blue-500/15',
  },
  PHONE_SCREEN: {
    label: 'Phone Screen',
    className:
      'bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:text-yellow-400 dark:bg-yellow-500/15',
  },
  INTERVIEW: {
    label: 'Interview',
    className:
      'bg-orange-500/10 text-orange-700 border-orange-500/20 dark:text-orange-400 dark:bg-orange-500/15',
  },
  OFFER: {
    label: 'Offer',
    className:
      'bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400 dark:bg-green-500/15',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400 dark:bg-red-500/15',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    className: 'bg-muted text-muted-foreground/60 border-border opacity-75',
  },
}

export { STATUS_CONFIG }

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  )
}
