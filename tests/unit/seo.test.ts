import { describe, expect, it } from 'vitest'
import { canonicalUrl, websiteJsonLd, productJsonLd } from '../../src/lib/seo'
import type { Bike } from '../../src/lib/schema'

const baseBike: Bike = {
  slug: 'test-bike',
  model: 'KAA084',
  marketingName: 'K3',
  wheelSize: 16,
  weightKg: 8.7,
  priceCny: 3500,
  priceUpdatedAt: '2026-09-01',
  heightRangeCm: [155, 185],
  status: 'active',
  discontinuedInfo: null,
  highlights: ['超轻便携', '城市通勤首选'],
  pros: ['轻', '快'],
  cons: ['贵'],
  drivetrain: { speeds: 9, type: 'derailleur', climbScore: 3 },
  folding: { mechanism: '纵折', foldedSize: '71×41×55cm', carryScore: 4 },
  sources: ['dahon.com'],
  specs: {},
  updatedAt: '2026-09',
}

describe('canonicalUrl', () => {
  it('builds full URL from path', () => {
    expect(canonicalUrl('bikes/kaa084')).toBe(
      'https://jrli.github.io/dahon-picker/bikes/kaa084'
    )
  })

  it('handles root path', () => {
    expect(canonicalUrl('')).toBe('https://jrli.github.io/dahon-picker/')
  })

  it('handles nested paths', () => {
    expect(canonicalUrl('compare?ids=kaa084,paa013')).toBe(
      'https://jrli.github.io/dahon-picker/compare?ids=kaa084,paa013'
    )
  })
})

describe('websiteJsonLd', () => {
  it('returns valid JSON-LD for WebSite', () => {
    const ld = JSON.parse(websiteJsonLd('大行选购器', 'https://jrli.github.io/dahon-picker/'))
    expect(ld['@type']).toBe('WebSite')
    expect(ld.name).toBe('大行选购器')
    expect(ld.url).toContain('jrli.github.io')
  })
})

describe('productJsonLd', () => {
  it('returns valid JSON-LD for Product', () => {
    const url = 'https://jrli.github.io/dahon-picker/bikes/test-bike'
    const ld = JSON.parse(productJsonLd(baseBike, url))
    expect(ld['@type']).toBe('Product')
    expect(ld.name).toBe('KAA084 K3')
    expect(ld.brand.name).toBe('DAHON')
    expect(ld.offers.price).toBe(3500)
    expect(ld.offers.priceCurrency).toBe('CNY')
    expect(ld.offers.availability).toContain('InStock')
  })

  it('uses highlights for description', () => {
    const url = 'https://jrli.github.io/dahon-picker/bikes/test-bike'
    const ld = JSON.parse(productJsonLd(baseBike, url))
    expect(ld.description).toContain('超轻便携')
  })

  it('marks discontinued bikes as out of stock', () => {
    const discontinued = { ...baseBike, status: 'discontinued' as const, discontinuedInfo: { year: 2024 } }
    const url = 'https://jrli.github.io/dahon-picker/bikes/test-bike'
    const ld = JSON.parse(productJsonLd(discontinued, url))
    expect(ld.offers.availability).toContain('Discontinued')
  })
})
