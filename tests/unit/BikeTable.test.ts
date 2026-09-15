// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BikeTable from '../../src/components/BikeTable.vue'
import { mkBike } from '../helpers'

const bikes = [
  mkBike({ slug: 'k16', model: 'KAA084', marketingName: 'K3', wheelSize: 16, priceCny: 3500 }),
  mkBike({ slug: 'p20', model: 'PAA013', marketingName: 'P8', wheelSize: 20, priceCny: 2800 }),
  mkBike({ slug: 'd20', model: 'DAA063', marketingName: 'D8', wheelSize: 20, priceCny: 2200, useCases: ['casual'] }),
]

describe('BikeTable', () => {
  it('默认列出全部在售,默认价格升序', () => {
    const w = mount(BikeTable, { props: { bikes } })
    expect(w.findAll('.bike-list li')).toHaveLength(3)
    expect(w.text()).toContain('共 3 款')
    expect(w.findAll('.bike-list h2')[0].text()).toContain('DAA063')
  })
  it('轮径选项从数据推导并按选择过滤', async () => {
    const w = mount(BikeTable, { props: { bikes } })
    const wheelSelect = w.findAll('select')[0]
    expect(wheelSelect.findAll('option').length).toBeGreaterThanOrEqual(3) // 全部/16/20
    await wheelSelect.setValue('16')
    expect(w.text()).toContain('共 1 款')
    expect(w.text()).toContain('KAA084')
  })
  it('用途筛选生效', async () => {
    const w = mount(BikeTable, { props: { bikes } })
    await w.findAll('select')[1].setValue('casual')
    expect(w.text()).toContain('共 1 款')
    expect(w.text()).toContain('DAA063')
  })
  it('变速筛选:档位选项从数据推导,"8 速及以上"保留全部测试车', async () => {
    const w = mount(BikeTable, { props: { bikes } })
    const speedSelect = w.findAll('select')[3]
    // 测试车默认 8 速:数据推导出的第一个档位即 8
    await speedSelect.setValue('8')
    expect(w.text()).toContain('共 3 款')
    const tenOnly = [
      ...bikes,
      mkBike({ slug: 'fast', model: 'RAA002', marketingName: 'R10', priceCny: 5000, drivetrain: { speeds: 10, climbScore: 4 } }),
    ]
    const w2 = mount(BikeTable, { props: { bikes: tenOnly } })
    await w2.findAll('select')[3].setValue('10')
    expect(w2.text()).toContain('共 1 款')
    expect(w2.text()).toContain('RAA002')
  })
  it('筛选为空时显示兜底文案', async () => {
    const w = mount(BikeTable, { props: { bikes } })
    await w.findAll('select')[0].setValue('16')
    await w.findAll('select')[1].setValue('casual')
    expect(w.text()).toContain('没有符合条件的车型')
  })
  it('每款链接到详情页', () => {
    const w = mount(BikeTable, { props: { bikes } })
    const hrefs = w.findAll('.bike-list a').map((a) => a.attributes('href'))
    expect(hrefs).toContain('/bikes/k16')
    expect(hrefs).toContain('/bikes/p20')
  })
})
