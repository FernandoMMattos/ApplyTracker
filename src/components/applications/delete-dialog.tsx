'use client'

import { toast } from 'sonner'
import type { Application } from '@prisma/client'

import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  application: Application | null
}

export function DeleteDialog({ open, onOpenChange, application }: Props) {
  const utils = trpc.useUtils()

  const deleteMutation = trpc.application.delete.useMutation({
    onSuccess: () => {
      void utils.application.getAll.invalidate()
      void utils.application.getStats.invalidate()
      toast.success('Application deleted')
      onOpenChange(false)
    },
    onError: (err) => toast.error(err.message),
  })

  if (!application) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Application</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete your application to{' '}
            <span className="text-foreground font-medium">{application.company}</span> for the{' '}
            <span className="text-foreground font-medium">{application.role}</span> role? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate({ id: application.id })}
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
