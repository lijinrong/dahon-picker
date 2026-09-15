import { describe, expect, it } from 'vitest'
import { filterBikes, sortBikes } from '../../src/lib/filter'
import { mkBike } from '../helpers'

const bikes = [
  mkBike({ slug: 'a', wheelSize: 16, priceCny: 3500, weightKg: 9.5, useCases: ['commute'] }),
  mkBike({ slug: 'b', wheelSize: 20, priceCny: 2000, weightKg: 12, useCases: ['casual'] }),
  mkBike({ slug: 'c', wheelSize: 20, priceCny: 6000, weightKg: 10.5, useCases: ['sport'] }),
  mkBike({ slug: 'old', status: 'discontinued', discontinuedInfo: { lastPriceCny: 1800, year: 2023 }, priceCny: 1800, weightKg: 13 }),
]

describe('filterBikes', () => {
  it('默认只返回在售', () => {
    expect(filterBikes(bikes, {}).map((b) => b.slug)).toEqual(['a', 'b', 'c'])
  })
  it('按轮径筛选', () => {
    expect(filterBikes(bikes, { wheelSize: 20 }).map((b) => b.slug)).toEqual(['b', 'c'])
  })
  it('按价格区间筛选(闭区间)', () => {
    expect(filterBikes(bikes, { priceMin: 2000, priceMax: 3500 }).map((b) => b.slug)).toEqual(['a', 'b'])
  })
  it('按用途筛选', () => {
    expect(filterBikes(bikes, { useCase: 'sport' }).map((b) => b.slug)).toEqual(['c'])
  })
  it('按最低变速数筛选', () => {
    expect(filterBikes(bikes, { minSpeeds: 8 }).map((b) => b.slug)).toEqual(['a', 'b', 'c'])
  })
})

describe('sortBikes', () => {
  it('价格升序/降序、重量升序', () => {
    expect(sortBikes(bikes, 'price-asc').map((b) => b.slug)).toEqual(['old', 'b', 'a', 'c'])
    expect(sortBikes(bikes, 'price-desc').map((b) => b.slug)).toEqual(['c', 'a', 'b', 'old'])
    expect(sortBikes(bikes, 'weight-asc').map((b) => b.slug)).toEqual(['a', 'c', 'b', 'old'])
  })
  it('不修改入参数组', () => {
    const before = [...bikes]
    sortBikes(bikes, 'price-asc')
    expect(bikes).toEqual(before)
  })
})
