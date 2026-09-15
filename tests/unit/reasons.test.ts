import { describe, expect, it } from 'vitest'
import { recommend, type Recommendation, type RankedResult } from '../../src/lib/recommend'
import { reasonsFor } from '../../src/lib/reasons'
import { mkBike, mkAnswers } from '../helpers'

function scenario(overrides: Parameters<typeof mkBike>[0], answers: Parameters<typeof mkAnswers>[0]) {
  const bike = mkBike(overrides)
  const result = recommend(mkAnswers(answers), [bike])
  const rec = result.recommendations[0]
  return { bike, result, rec }
}

describe('reasonsFor', () => {
  it('用途命中给出对应理由', () => {
    const { rec, result } = scenario({}, {})
    const texts = reasonsFor(rec as Recommendation, mkAnswers(), result as RankedResult).map((r) => r.text)
    expect(texts).toContain('适合城市通勤的定位')
  })
  it('daily + carryScore>=4 给出携带理由', () => {
    const { rec, result } = scenario({ folding: { mechanism: 'x', foldedSize: 'x', carryScore: 5 } }, { fold: 'daily' })
    const texts = reasonsFor(rec, mkAnswers({ fold: 'daily' }), result).map((r) => r.text)
    expect(texts).toContain('折叠紧凑,适合每天携带')
  })
  it('rarely + carryScore<=3 给出“不常折叠”理由', () => {
    const { rec, result } = scenario({ folding: { mechanism: 'x', foldedSize: 'x', carryScore: 2 } }, { fold: 'rarely' })
    const texts = reasonsFor(rec, mkAnswers({ fold: 'rarely' }), result).map((r) => r.text)
    expect(texts).toContain('不常折叠的话,这款的配置更值')
  })
  it('travel + 重量<=10kg 给出轻量理由(含具体重量)', () => {
    const { rec, result } = scenario({ weightKg: 9.4, useCases: ['travel'] }, { useCase: 'travel' })
    const texts = reasonsFor(rec, mkAnswers({ useCase: 'travel' }), result).map((r) => r.text)
    expect(texts).toContain('仅 9.4kg,拎着走不费劲')
  })
  it('strict 模式内价格落在容差区间给出 stretch 理由(含价格)', () => {
    const { rec, result } = scenario({ priceCny: 4300 }, {})
    const texts = reasonsFor(rec, mkAnswers(), result).map((r) => r.text)
    expect(texts).toContain('价格略超预算上限,参考价 4300 元')
  })
  it('relaxed 预算放宽时给出超预算理由', () => {
    const { rec, result } = scenario({ priceCny: 9000, heightRangeCm: [150, 190] }, { height: '160-170' })
    const rs = reasonsFor(rec, mkAnswers({ height: '160-170' }), result)
    expect(rs.some((r) => r.kind === 'relaxed' && r.text.includes('超出你的预算区间'))).toBe(true)
  })
  it('relaxed 身高放宽时给出试骑建议', () => {
    const bike = mkBike({ slug: 'tall', heightRangeCm: [175, 195] })
    const result = recommend(mkAnswers({ height: '160-170' }), [bike])
    const rs = reasonsFor(result.recommendations[0], mkAnswers({ height: '160-170' }), result)
    expect(rs.some((r) => r.text.includes('试骑确认'))).toBe(true)
  })
})
