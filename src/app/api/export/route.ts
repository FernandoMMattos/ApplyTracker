import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

function escapeCSV(value: string | null | undefined): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatDate(date: Date | null): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const applications = await db.application.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  const headers = [
    'Company',
    'Role',
    'Status',
    'Location',
    'Salary',
    'Applied Date',
    'Deadline',
    'Job URL',
    'Notes',
  ]
  const rows = applications.map((a) => [
    escapeCSV(a.company),
    escapeCSV(a.role),
    escapeCSV(a.status),
    escapeCSV(a.location),
    escapeCSV(a.salary),
    escapeCSV(formatDate(a.appliedAt)),
    escapeCSV(formatDate(a.deadline)),
    escapeCSV(a.jobUrl),
    escapeCSV(a.notes),
  ])

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="applications.csv"',
    },
  })
}
