// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CompareTable from '../../src/components/CompareTable.vue'
import { mkBike } from '../helpers'

const assign = vi.fn()
const replace = vi.fn()

const bikes = [
  mkBike({ slug: 'a', model: 'KAA084', marketingName: 'K3', priceCny: 3500, weightKg: 9.5, wheelSize: 16 }),
  mkBike({ slug: 'b', model: 'PAA013', marketingName: 'P8', priceCny: 2800, weightKg: 11.2, wheelSize: 20 }),
  mkBike({ slug: 'c', model: 'DAA063', marketingName: 'D8', priceCny: 2800, weightKg: 11.2, wheelSize: 20 }),
]

function mountWith(search: string) {
  vi.stubGlobal('location', { assign, replace, search, pathname: '/compare' })
  return mount(CompareTable, { props: { bikes } })
}

describe('CompareTable', () => {
  beforeEach(() => {
    assign.mockClear()
    replace.mockClear()
  })

  it('按 URL ids 渲染对应车型列', async () => {
    const w = mountWith('?ids=a,b')
    await w.vm.$nextTick()
    expect(w.text()).toContain('KAA084')
    expect(w.text()).toContain('PAA013')
    expect(w.text()).not.toContain('DAA063')
  })
  it('未知 slug 被忽略', () => {
    const w = mountWith('?ids=a,zzz')
    expect(w.text()).toContain('至少选择两款')
  })
  it('值不同的行加 diff 高亮,相同的行不加', async () => {
    const w = mountWith('?ids=b,c') // b 与 c 价格/重量/轮径相同,代码不同
    await w.vm.$nextTick()
    const diffRows = w.findAll('tr.diff').map((r) => r.text())
    expect(diffRows.join('|')).not.toContain('参考价')
    const w2 = mountWith('?ids=a,b')
    await w2.vm.$nextTick()
    expect(w2.findAll('tr.diff').map((r) => r.text()).join('|')).toContain('参考价')
  })
  it('无参数或少于 2 款时显示用法提示', () => {
    expect(mountWith('').text()).toContain('至少选择两款')
    expect(mountWith('?ids=a').text()).toContain('至少选择两款')
  })
  it('每列链接到详情页', async () => {
    const w = mountWith('?ids=a,b')
    await w.vm.$nextTick()
    const hrefs = w.findAll('a').map((x) => x.attributes('href'))
    expect(hrefs).toContain('/bikes/a')
    expect(hrefs).toContain('/bikes/b')
  })
})
