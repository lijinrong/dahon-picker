import { describe, expect, it } from 'vitest'
import { priceDelta } from '../../src/lib/priceDelta'
import { mkBike } from '../helpers'

describe('priceDelta', () => {
  it('returns null when no price history', () => {
    const bike = mkBike({ priceHistory: [] })
    expect(priceDelta(bike)).toBeNull()
  })

  it('returns up delta when price increased', () => {
    const bike = mkBike({ priceCny: 3500, priceHistory: [{ price: 3200, date: '2026-07-15' }] })
    const d = priceDelta(bike)!
    expect(d.direction).toBe('up')
    expect(d.amount).toBe(300)
    expect(d.label).toBe('+¥300')
  })

  it('returns down delta when price decreased', () => {
    const bike = mkBike({ priceCny: 2800, priceHistory: [{ price: 3000, date: '2026-07-15' }] })
    const d = priceDelta(bike)!
    expect(d.direction).toBe('down')
    expect(d.amount).toBe(-200)
    expect(d.label).toBe('-¥200')
  })

  it('returns null when price unchanged', () => {
    const bike = mkBike({ priceCny: 3000, priceHistory: [{ price: 3000, date: '2026-07-15' }] })
    expect(priceDelta(bike)).toBeNull()
  })

  it('uses the last history entry (most recent)', () => {
    const bike = mkBike({
      priceCny: 3500,
      priceHistory: [
        { price: 2800, date: '2026-01-15' },
        { price: 3200, date: '2026-05-15' },
      ],
    })
    const d = priceDelta(bike)!
    expect(d.amount).toBe(300)  // 3500 - 3200
  })
})
