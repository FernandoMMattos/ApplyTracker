import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({ db: {} }))

import { escapeCSV, formatDate } from '@/app/api/export/route'

describe('escapeCSV', () => {
  it('returns an empty string for null', () => {
    expect(escapeCSV(null)).toBe('')
  })

  it('returns an empty string for undefined', () => {
    expect(escapeCSV(undefined)).toBe('')
  })

  it('returns a plain string unchanged', () => {
    expect(escapeCSV('hello')).toBe('hello')
  })

  it('wraps a string containing a comma in double quotes', () => {
    expect(escapeCSV('hello, world')).toBe('"hello, world"')
  })

  it('escapes internal double quotes by doubling them', () => {
    expect(escapeCSV('say "hello"')).toBe('"say ""hello"""')
  })

  it('wraps a string containing a newline', () => {
    expect(escapeCSV('line1\nline2')).toBe('"line1\nline2"')
  })

  it('handles a string with both a comma and a quote', () => {
    expect(escapeCSV('a, "b"')).toBe('"a, ""b"""')
  })
})

describe('formatDate', () => {
  it('returns an empty string for null', () => {
    expect(formatDate(null)).toBe('')
  })

  it('returns a date in MM/DD/YYYY format', () => {
    const result = formatDate(new Date('2024-03-15T12:00:00.000Z'))
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })
})
