import { describe, expect, it } from 'vitest'
import { canonicalUrl, websiteJsonLd, productJsonLd } from '../../src/lib/seo'
import { mkBike } from '../helpers'

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
    const bike = mkBike({ slug: 'test-bike', model: 'KAA084', marketingName: 'K3', priceCny: 3500 })
    const url = 'https://jrli.github.io/dahon-picker/bikes/test-bike'
    const ld = JSON.parse(productJsonLd(bike, url))
    expect(ld['@type']).toBe('Product')
    expect(ld.name).toBe('KAA084 K3')
    expect(ld.brand.name).toBe('DAHON')
    expect(ld.offers.price).toBe(3500)
    expect(ld.offers.priceCurrency).toBe('CNY')
    expect(ld.offers.availability).toContain('InStock')
  })

  it('uses highlights for description', () => {
    const bike = mkBike({ highlights: ['超轻便携', '城市通勤首选'] })
    const url = 'https://jrli.github.io/dahon-picker/bikes/test-bike'
    const ld = JSON.parse(productJsonLd(bike, url))
    expect(ld.description).toContain('超轻便携')
  })

  it('marks discontinued bikes as discontinued', () => {
    const bike = mkBike({
      status: 'discontinued',
      discontinuedInfo: { lastPriceCny: 3500, year: 2024 },
    })
    const url = 'https://jrli.github.io/dahon-picker/bikes/test-bike'
    const ld = JSON.parse(productJsonLd(bike, url))
    expect(ld.offers.availability).toContain('Discontinued')
  })
})
