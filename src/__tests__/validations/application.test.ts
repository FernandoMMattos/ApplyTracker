import { describe, it, expect } from 'vitest'
import {
  applicationStatusSchema,
  createApplicationSchema,
  updateApplicationSchema,
} from '@/lib/validations/application'

describe('applicationStatusSchema', () => {
  it('accepts all valid statuses', () => {
    const valid = [
      'SAVED',
      'APPLIED',
      'PHONE_SCREEN',
      'INTERVIEW',
      'OFFER',
      'REJECTED',
      'WITHDRAWN',
    ]
    for (const s of valid) {
      expect(applicationStatusSchema.parse(s)).toBe(s)
    }
  })

  it('rejects an unknown value', () => {
    expect(() => applicationStatusSchema.parse('PENDING')).toThrow()
    expect(() => applicationStatusSchema.parse('')).toThrow()
  })
})

describe('createApplicationSchema', () => {
  const base = { company: 'Acme Corp', role: 'Software Engineer' }

  it('uses SAVED as the default status', () => {
    expect(createApplicationSchema.parse(base).status).toBe('SAVED')
  })

  it('accepts a full valid payload', () => {
    const result = createApplicationSchema.parse({
      ...base,
      status: 'APPLIED',
      jobUrl: 'https://jobs.example.com/123',
      location: 'Remote',
      salary: '$120k–$150k',
      notes: 'Interesting role',
    })
    expect(result.company).toBe('Acme Corp')
    expect(result.status).toBe('APPLIED')
    expect(result.location).toBe('Remote')
  })

  it('rejects an empty company', () => {
    expect(() => createApplicationSchema.parse({ ...base, company: '' })).toThrow()
  })

  it('rejects an empty role', () => {
    expect(() => createApplicationSchema.parse({ ...base, role: '' })).toThrow()
  })

  it('rejects a company longer than 100 characters', () => {
    expect(() => createApplicationSchema.parse({ ...base, company: 'A'.repeat(101) })).toThrow()
  })

  it('rejects a role longer than 100 characters', () => {
    expect(() => createApplicationSchema.parse({ ...base, role: 'A'.repeat(101) })).toThrow()
  })

  it('rejects an invalid jobUrl', () => {
    expect(() => createApplicationSchema.parse({ ...base, jobUrl: 'not-a-url' })).toThrow()
  })

  it('accepts an empty string for jobUrl', () => {
    expect(createApplicationSchema.parse({ ...base, jobUrl: '' }).jobUrl).toBe('')
  })

  it('accepts a valid URL for jobUrl', () => {
    const url = 'https://jobs.example.com/eng-123'
    expect(createApplicationSchema.parse({ ...base, jobUrl: url }).jobUrl).toBe(url)
  })

  it('rejects notes longer than 2000 characters', () => {
    expect(() => createApplicationSchema.parse({ ...base, notes: 'x'.repeat(2001) })).toThrow()
  })

  it('accepts notes at the 2000-character boundary', () => {
    const notes = 'x'.repeat(2000)
    expect(createApplicationSchema.parse({ ...base, notes }).notes).toBe(notes)
  })
})

describe('updateApplicationSchema', () => {
  it('requires id', () => {
    expect(() => updateApplicationSchema.parse({ company: 'Acme' })).toThrow()
  })

  it('accepts id with no other fields', () => {
    expect(updateApplicationSchema.parse({ id: 'app-1' }).id).toBe('app-1')
  })

  it('accepts a partial update with only status', () => {
    const result = updateApplicationSchema.parse({ id: 'app-1', status: 'OFFER' })
    expect(result.status).toBe('OFFER')
  })

  it('rejects an invalid status in update', () => {
    expect(() => updateApplicationSchema.parse({ id: 'app-1', status: 'GHOSTED' })).toThrow()
  })

  it('rejects an invalid jobUrl in update', () => {
    expect(() => updateApplicationSchema.parse({ id: 'app-1', jobUrl: 'not-a-url' })).toThrow()
  })
})
