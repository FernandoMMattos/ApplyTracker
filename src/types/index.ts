export type ApplicationStatus =
  | 'SAVED'
  | 'APPLIED'
  | 'PHONE_SCREEN'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN'

export type Application = {
  id: string
  company: string
  role: string
  status: ApplicationStatus
  jobUrl: string | null
  location: string | null
  salary: string | null
  notes: string | null
  appliedAt: Date | null
  deadline: Date | null
  createdAt: Date
  updatedAt: Date
  userId: string
}
