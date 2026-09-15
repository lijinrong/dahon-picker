import { describe, expect, it } from 'vitest'
import { decodeModel } from '../../src/lib/decode'
import { mkBike } from '../helpers'
import type { Naming } from '../../src/lib/schema'

const naming: Naming = {
  positions: [
    { index: 0, dimension: '系列/轮径', map: { K: '16 寸便携系列', P: '20 寸均衡系列' } },
    { index: 1, dimension: '车架/材质', map: { A: '铝合金车架' } },
    { index: 2, dimension: '配置档位', map: { A: '入门配置', B: '进阶配置' } },
  ],
  nicknames: { K3: 'kaa084', P8: 'paa013' },
  uncertain: [{ note: '数字位官方未公开统一规则' }],
}

const bikes = [
  mkBike({ slug: 'kaa084', model: 'KAA084' }),
  mkBike({ slug: 'paa013', model: 'PAA013' }),
]

describe('decodeModel', () => {
  it('精确匹配官方代码,逐位给出含义', () => {
    const r = decodeModel('KAA084', naming, bikes)
    expect(r.matched).toBe(true)
    expect(r.slug).toBe('kaa084')
    expect(r.segments.map((s) => s.meaning)).toEqual(['16 寸便携系列', '铝合金车架', '入门配置', null, null, null])
  })
  it('市场俗称映射到官方型号', () => {
    const r = decodeModel('K3', naming, bikes)
    expect(r.matched).toBe(true)
    expect(r.viaNickname).toBe('K3')
    expect(r.slug).toBe('kaa084')
    expect(r.segments[0].char).toBe('K')
  })
  it('输入小写/带空格自动归一', () => {
    const r = decodeModel(' kaa084 ', naming, bikes)
    expect(r.matched).toBe(true)
  })
  it('未知输入且无相近项:suggestions 为空', () => {
    const r = decodeModel('ZZZZZZZZ', naming, bikes)
    expect(r.matched).toBe(false)
    expect(r.suggestions).toEqual([])
  })
  it('拼写相近给建议(编辑距离<=2)', () => {
    const r = decodeModel('KKA084', naming, bikes)
    expect(r.matched).toBe(false)
    expect(r.suggestions).toContain('KAA084')
  })
  it('规则缺失的位 meaning 为 null 并附 note', () => {
    const r = decodeModel('KAA084', naming, bikes)
    expect(r.segments[3].meaning).toBeNull()
    expect(r.segments[3].note).toContain('官方未公开')
  })
  it('nameDecodeOverride 优先于规则表', () => {
    const override = [
      { char: 'K', meaning: 'K 系列(特别版编号)' },
      { char: '0', meaning: '2020 年款' },
    ]
    const withOverride = [...bikes, mkBike({ slug: 'k-sp', model: 'KAA084', nameDecodeOverride: override })]
    const r = decodeModel('KAA084', naming, withOverride)
    expect(r.slug).toBe('kaa084')
    expect(r.segments[0].meaning).toBe('16 寸便携系列')
    const r2 = decodeModel('KAA084', naming, [
      mkBike({ slug: 'k-sp', model: 'KAA084', nameDecodeOverride: override }),
      ...bikes,
    ])
    expect(r2.slug).toBe('k-sp')
    expect(r2.segments[0].meaning).toBe('K 系列(特别版编号)')
    expect(r2.segments[3].meaning).toBe('2020 年款')
  })
})
