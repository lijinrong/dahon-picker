import { describe, expect, it } from 'vitest'
import { recommend } from '../../src/lib/recommend'
import { mkBike, mkAnswers } from '../helpers'

describe('recommend 硬过滤', () => {
  it('过滤停产车型', () => {
    const bikes = [mkBike({ slug: 'a', status: 'discontinued', discontinuedInfo: { lastPriceCny: 2000, year: 2024 } })]
    const r = recommend(mkAnswers(), bikes)
    expect(r.recommendations).toHaveLength(0)
    expect(r.mode).toBe('relaxed')
  })
  it('价格容差:预算上限 4000 时 4400 通过、4401 被过滤', () => {
    const bikes = [
      mkBike({ slug: 'edge-ok', priceCny: 4400 }),
      mkBike({ slug: 'edge-no', priceCny: 4401 }),
    ]
    const slugs = recommend(mkAnswers(), bikes).recommendations.map((r) => r.bike.slug)
    expect(slugs).toContain('edge-ok')
    expect(slugs).not.toContain('edge-no')
  })
  it('身高:155 以下用户匹配不到下限 160 的车 → 放宽身高', () => {
    const bikes = [mkBike({ slug: 'tall-only', heightRangeCm: [160, 190], priceCny: 3000 })]
    const r = recommend(mkAnswers({ height: 'under-160' }), bikes)
    expect(r.mode).toBe('relaxed')
    expect(r.relaxedDimensions).toEqual(['height'])
    expect(r.recommendations[0].bike.slug).toBe('tall-only')
  })
  it('over-8000 预算不做价格过滤', () => {
    const bikes = [mkBike({ slug: 'lux', priceCny: 128000 })]
    const r = recommend(mkAnswers({ budget: 'over-8000' }), bikes)
    expect(r.mode).toBe('strict')
  })
})

describe('recommend 打分与排序', () => {
  it('daily 折叠场景下 carryScore 高者排前', () => {
    const bikes = [
      mkBike({ slug: 'chunky', folding: { mechanism: 'x', foldedSize: 'x', carryScore: 2 } }),
      mkBike({ slug: 'handy', folding: { mechanism: 'x', foldedSize: 'x', carryScore: 5 } }),
    ]
    const r = recommend(mkAnswers({ fold: 'daily' }), bikes)
    expect(r.recommendations[0].bike.slug).toBe('handy')
  })
  it('用途不匹配的车型得分劣势', () => {
    const bikes = [
      mkBike({ slug: 'match', useCases: ['commute'] }),
      mkBike({ slug: 'off', useCases: ['casual'], folding: { mechanism: 'x', foldedSize: 'x', carryScore: 5 } }),
    ]
    const r = recommend(mkAnswers({ fold: 'rarely' }), bikes)
    expect(r.recommendations[0].bike.slug).toBe('match')
  })
  it('同分按价格升序、再按 slug 字典序', () => {
    const bikes = [
      mkBike({ slug: 'b', priceCny: 2500 }),
      mkBike({ slug: 'a', priceCny: 2500 }),
      mkBike({ slug: 'c', priceCny: 3000 }),
    ]
    const r = recommend(mkAnswers({ fold: 'rarely' }), bikes)
    expect(r.recommendations.map((x) => x.bike.slug)).toEqual(['a', 'b', 'c'])
  })
  it('最多输出 4 款', () => {
    const bikes = Array.from({ length: 6 }, (_, i) => mkBike({ slug: 'bike-' + i }))
    expect(recommend(mkAnswers(), bikes).recommendations).toHaveLength(4)
  })
})

describe('recommend 放宽兜底', () => {
  it('身高都合适但全部超预算 → 放宽预算', () => {
    const bikes = [mkBike({ slug: 'pricey', priceCny: 9000, heightRangeCm: [150, 190] })]
    const r = recommend(mkAnswers({ height: '160-170' }), bikes)
    expect(r.mode).toBe('relaxed')
    expect(r.relaxedDimensions).toEqual(['budget'])
  })
  it('无在售车型 → 空推荐 + 双放宽标记', () => {
    const r = recommend(mkAnswers(), [])
    expect(r.mode).toBe('relaxed')
    expect(r.relaxedDimensions).toEqual(['budget', 'height'])
    expect(r.recommendations).toHaveLength(0)
  })
})
