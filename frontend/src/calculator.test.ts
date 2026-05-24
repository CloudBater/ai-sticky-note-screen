import { describe, it, expect } from 'vitest'
import { convert, formatRate } from './calculator'

describe('convert', () => {
  it('multiplies amount by rate', () => {
    expect(convert(100, 0.9)).toBeCloseTo(90)
  })

  it('returns 0 when amount is 0', () => {
    expect(convert(0, 0.9)).toBe(0)
  })

  it('returns 0 when rate is 0', () => {
    expect(convert(100, 0)).toBe(0)
  })

  it('handles fractional amounts', () => {
    expect(convert(1.5, 2)).toBeCloseTo(3)
  })

  it('rejects negative amounts', () => {
    expect(() => convert(-1, 0.9)).toThrow()
  })
})

describe('formatRate', () => {
  it('formats to 4 decimal places', () => {
    expect(formatRate(0.9012345)).toBe('0.9012')
  })

  it('handles whole numbers', () => {
    expect(formatRate(144)).toBe('144.0000')
  })
})
