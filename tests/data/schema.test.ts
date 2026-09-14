import { describe, expect, it } from 'vitest'
import { mkBike } from '../helpers'
import { bikeSchema, loadBikes } from '../../src/lib/schema'

describe('bikeSchema', () => {
  it('接受合法车型', () => {
    expect(bikeSchema.safeParse(mkBike()).success).toBe(true)
  })
  it('拒绝未知字段(防字段拼写错误)', () => {
    expect(bikeSchema.safeParse({ ...mkBike(), prices: 3000 }).success).toBe(false)
  })
  it('拒绝身高区间倒置', () => {
    expect(bikeSchema.safeParse(mkBike({ heightRangeCm: [180, 160] })).success).toBe(false)
  })
  it('拒绝越界评级 carryScore=6', () => {
    expect(
      bikeSchema.safeParse(mkBike({ folding: { mechanism: 'x', foldedSize: 'x', carryScore: 6 } })).success,
    ).toBe(false)
  })
  it('停产车型必须带 discontinuedInfo', () => {
    expect(bikeSchema.safeParse(mkBike({ status: 'discontinued' })).success).toBe(false)
  })
  it('来源少于 2 个被拒', () => {
    expect(bikeSchema.safeParse(mkBike({ sources: ['仅一个来源'] })).success).toBe(false)
  })
})

describe('bikes.json 数据文件', () => {
  it('全量通过 schema 且 slug 唯一', () => {
    expect(() => loadBikes()).not.toThrow()
    const slugs = loadBikes().map((b) => b.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})
