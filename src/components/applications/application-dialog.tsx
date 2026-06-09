'use client'

import type { Application, AiInsight } from '@prisma/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ApplicationForm } from './application-form'

type ApplicationWithInsight = Application & { aiInsight: AiInsight | null }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  application?: ApplicationWithInsight
}

export function ApplicationDialog({ open, onOpenChange, application }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{application ? 'Edit Application' : 'New Application'}</DialogTitle>
          <DialogDescription>
            {application
              ? 'Update the details for this job application.'
              : 'Track a new job application by filling in the details below.'}
          </DialogDescription>
        </DialogHeader>
        <ApplicationForm application={application} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
