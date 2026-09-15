import { describe, expect, it } from 'vitest'
import { loadBikes } from '../../src/lib/schema'

describe('数据集完整性', () => {
  it('在售车型不少于 30 款', () => {
    expect(loadBikes().filter((b) => b.status === 'active').length).toBeGreaterThanOrEqual(30)
  })
  it('官方代码唯一', () => {
    const models = loadBikes().map((b) => b.model)
    expect(new Set(models).size).toBe(models.length)
  })
  it('全部车型有价格更新日期且在合理范围', () => {
    for (const b of loadBikes()) {
      expect(b.priceCny).toBeGreaterThan(500)
      expect(b.priceUpdatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})
