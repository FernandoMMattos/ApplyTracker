'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import type { Application, AiInsight } from '@prisma/client'

import { trpc } from '@/lib/trpc/client'
import { applicationStatusSchema } from '@/lib/validations/application'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const formSchema = z.object({
  company: z.string().min(1, 'Company is required').max(100),
  role: z.string().min(1, 'Role is required').max(100),
  status: applicationStatusSchema,
  jobUrl: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  salary: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
  appliedAt: z.string().optional(),
  deadline: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

type ApplicationWithInsight = Application & { aiInsight: AiInsight | null }

const STATUS_OPTIONS = [
  { value: 'SAVED', label: 'Saved' },
  { value: 'APPLIED', label: 'Applied' },
  { value: 'PHONE_SCREEN', label: 'Phone Screen' },
  { value: 'INTERVIEW', label: 'Interview' },
  { value: 'OFFER', label: 'Offer' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
] as const

function toDateInput(date: Date | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type Props = {
  application?: ApplicationWithInsight
  onSuccess: () => void
}

export function ApplicationForm({ application, onSuccess }: Props) {
  const utils = trpc.useUtils()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company: application?.company ?? '',
      role: application?.role ?? '',
      status: application?.status ?? 'SAVED',
      jobUrl: application?.jobUrl ?? '',
      location: application?.location ?? '',
      salary: application?.salary ?? '',
      notes: application?.notes ?? '',
      appliedAt: toDateInput(application?.appliedAt),
      deadline: toDateInput(application?.deadline),
    },
  })

  const createMutation = trpc.application.create.useMutation({
    onSuccess: () => {
      void utils.application.getAll.invalidate()
      void utils.application.getStats.invalidate()
      toast.success('Application added')
      onSuccess()
    },
    onError: (err) => toast.error(err.message),
  })

  const updateMutation = trpc.application.update.useMutation({
    onSuccess: () => {
      void utils.application.getAll.invalidate()
      void utils.application.getStats.invalidate()
      toast.success('Application updated')
      onSuccess()
    },
    onError: (err) => toast.error(err.message),
  })

  const onSubmit = (data: FormValues) => {
    const payload = {
      company: data.company,
      role: data.role,
      status: data.status,
      jobUrl: data.jobUrl || undefined,
      location: data.location || undefined,
      salary: data.salary || undefined,
      notes: data.notes || undefined,
      appliedAt: data.appliedAt ? new Date(data.appliedAt) : undefined,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    }

    if (application) {
      updateMutation.mutate({ id: application.id, ...payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="company">Company *</Label>
          <Input id="company" placeholder="Acme Corp" {...register('company')} />
          {errors.company && <p className="text-destructive text-xs">{errors.company.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">Role *</Label>
          <Input id="role" placeholder="Software Engineer" {...register('role')} />
          {errors.role && <p className="text-destructive text-xs">{errors.role.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" placeholder="Remote / New York" {...register('location')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="appliedAt">Applied Date</Label>
          <Input id="appliedAt" type="date" {...register('appliedAt')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deadline">Deadline</Label>
          <Input id="deadline" type="date" {...register('deadline')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="salary">Salary</Label>
          <Input id="salary" placeholder="$120k – $150k" {...register('salary')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="jobUrl">Job URL</Label>
          <Input id="jobUrl" type="url" placeholder="https://..." {...register('jobUrl')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Add any notes about this application..."
          className="min-h-20 resize-none"
          {...register('notes')}
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : application ? 'Save Changes' : 'Add Application'}
        </Button>
      </div>
    </form>
  )
}
