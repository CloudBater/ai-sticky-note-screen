import { describe, it, expect } from 'vitest'
import { accountAgeInYears } from './utils'

describe('accountAgeInYears', () => {
  it('returns a positive number for a past date', () => {
    expect(accountAgeInYears('2020-01-01T00:00:00Z')).toBeGreaterThan(0)
  })

  it('returns a larger value for an older account', () => {
    const older = accountAgeInYears('2015-01-01T00:00:00Z')
    const newer = accountAgeInYears('2023-01-01T00:00:00Z')
    expect(older).toBeGreaterThan(newer)
  })

  it('returns less than 1 for an account created within the last month', () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    expect(accountAgeInYears(thirtyDaysAgo)).toBeLessThan(1)
  })
})
