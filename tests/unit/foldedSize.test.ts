import { describe, expect, it } from 'vitest'
import { parseFoldedSize } from '../../src/lib/foldedSize'

describe('parseFoldedSize', () => {
  it('parses standard × format', () => {
    const r = parseFoldedSize('71×41×55cm')
    expect(r.parsed).toBe(true)
    // Sorted descending: 71, 55, 41 → length=71, height=55, width=41
    expect(r.length).toBe(71)
    expect(r.height).toBe(55)
    expect(r.width).toBe(41)
  })

  it('parses x-separated format', () => {
    const r = parseFoldedSize('60x30x50cm')
    expect(r.parsed).toBe(true)
    // Sorted: 60, 50, 30
    expect(r.length).toBe(60)
    expect(r.height).toBe(50)
    expect(r.width).toBe(30)
  })

  it('parses X-separated with spaces', () => {
    const r = parseFoldedSize('80 X 45 X 65 cm')
    expect(r.parsed).toBe(true)
    // Sorted: 80, 65, 45
    expect(r.length).toBe(80)
    expect(r.height).toBe(65)
    expect(r.width).toBe(45)
  })

  it('sorts dimensions descending (length ≥ height ≥ width)', () => {
    const r = parseFoldedSize('30×70×40cm')
    expect(r.length).toBe(70)
    expect(r.height).toBe(40)
    expect(r.width).toBe(30)
  })

  it('preserves raw input', () => {
    const raw = '71×41×55cm'
    expect(parseFoldedSize(raw).raw).toBe(raw)
  })

  it('returns parsed=false for unparseable input', () => {
    const r = parseFoldedSize('compact')
    expect(r.parsed).toBe(false)
  })

  it('handles decimal dimensions', () => {
    const r = parseFoldedSize('72.5×41.3×55.1cm')
    expect(r.parsed).toBe(true)
    expect(r.length).toBeCloseTo(72.5)
    expect(r.height).toBeCloseTo(55.1)
    expect(r.width).toBeCloseTo(41.3)
  })
})
