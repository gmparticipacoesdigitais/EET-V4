import { describe, expect, it } from 'vitest'
import { round, sumRounded } from './money'

describe('money.round', () => {
  it('applies half-even rounding on ties', () => {
    expect(round(1.235, 2, 'half-even')).toBe(1.24)
    expect(round(1.245, 2, 'half-even')).toBe(1.24)
    expect(round(1.255, 2, 'half-even')).toBe(1.26)
    expect(round(-1.235, 2, 'half-even')).toBe(-1.24)
    expect(round(-1.245, 2, 'half-even')).toBe(-1.24)
  })

  it('falls back to half-up when requested', () => {
    expect(round(1.235, 2, 'half-up')).toBe(1.24)
    expect(round(1.245, 2, 'half-up')).toBe(1.25)
  })
})

describe('money.sumRounded', () => {
  it('sums numbers applying rounding to avoid drift', () => {
    const values = [0.1, 0.2, 0.3]
    expect(sumRounded(values, 2, 'half-even')).toBe(0.6)
  })
})

