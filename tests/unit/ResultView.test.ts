// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ResultView from '../../src/components/ResultView.vue'
import { recommend } from '../../src/lib/recommend'
import { mkBike, mkAnswers } from '../helpers'

function mountedWith(bikes: Parameters<typeof recommend>[1], answers: Parameters<typeof recommend>[0]) {
  const result = recommend(answers, bikes)
  return mount(ResultView, { props: { result, answers } })
}

describe('ResultView', () => {
  const bikes = [
    mkBike({ slug: 'handy-16', model: 'KAA084', marketingName: 'K3', priceCny: 3500 }),
    mkBike({ slug: 'solid-20', model: 'PAA013', marketingName: 'P8', priceCny: 2800 }),
  ]

  it('渲染每款推荐的官方代码与俗称', () => {
    const w = mountedWith(bikes, mkAnswers())
    expect(w.text()).toContain('KAA084')
    expect(w.text()).toContain('K3')
    expect(w.text()).toContain('PAA013')
  })
  it('渲染理由 chip(用途命中)', () => {
    const w = mountedWith(bikes, mkAnswers())
    expect(w.text()).toContain('适合城市通勤的定位')
  })
  it('渲染参考价与更新年月', () => {
    const w = mountedWith(bikes, mkAnswers())
    expect(w.text()).toContain('¥3500')
    expect(w.text()).toContain('2026-09')
  })
  it('每款有详情与对比链接', () => {
    const w = mountedWith(bikes, mkAnswers())
    const hrefs = w.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toContain('/bikes/handy-16')
    expect(hrefs).toContain('/compare?ids=handy-16')
  })
  it('relaxed 模式显示放宽说明', () => {
    const pricey = [mkBike({ slug: 'rich', priceCny: 12000, heightRangeCm: [150, 195] })]
    const w = mountedWith(pricey, mkAnswers({ height: '160-170' }))
    expect(w.text()).toContain('完全匹配的组合暂时没有')
    expect(w.text()).toContain('价格超出了你的预算')
  })
  it('空推荐时显示兜底文案', () => {
    const w = mountedWith([], mkAnswers())
    expect(w.text()).toContain('暂时没有可推荐的车型')
  })
  it('点击重新答题触发 restart', async () => {
    const w = mountedWith(bikes, mkAnswers())
    await w.find('button.btn-ghost').trigger('click')
    expect(w.emitted('restart')).toHaveLength(1)
  })
})
