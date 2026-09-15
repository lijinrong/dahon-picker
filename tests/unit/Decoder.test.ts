// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Decoder from '../../src/components/Decoder.vue'
import { mkBike } from '../helpers'
import type { Naming } from '../../src/lib/schema'

const naming: Naming = {
  positions: [
    { index: 0, dimension: '系列/轮径', map: { K: '16 寸便携系列' } },
    { index: 1, dimension: '车架/材质', map: { A: '铝合金车架' } },
  ],
  nicknames: { K3: 'kaa084' },
  uncertain: [{ note: '数字位官方未公开统一规则' }],
}

const bikes = [mkBike({ slug: 'kaa084', model: 'KAA084' })]

function mounted() {
  return mount(Decoder, { props: { naming, bikes } })
}

async function submit(w: ReturnType<typeof mounted>, text: string) {
  await w.find('input').setValue(text)
  await w.find('form').trigger('submit')
}

describe('Decoder', () => {
  it('输入官方代码,逐位渲染解读', async () => {
    const w = mounted()
    await submit(w, 'KAA084')
    expect(w.findAll('.seg').length).toBe(6)
    expect(w.text()).toContain('16 寸便携系列')
    expect(w.find('a[href="/bikes/kaa084"]').exists()).toBe(true)
  })
  it('输入小写自动归一', async () => {
    const w = mounted()
    await submit(w, 'kaa084')
    expect(w.findAll('.seg').length).toBe(6)
  })
  it('输入俗称,提示映射关系', async () => {
    const w = mounted()
    await submit(w, 'K3')
    expect(w.text()).toContain('K3 是 KAA084 的市场俗称')
    expect(w.find('a[href="/bikes/kaa084"]').exists()).toBe(true)
  })
  it('拼写相近给出建议 chip,点击重查', async () => {
    const w = mounted()
    await submit(w, 'KKA084')
    expect(w.text()).toContain('没找到')
    const chip = w.findAll('button.chip').find((c) => c.text() === 'KAA084')
    expect(chip).toBeTruthy()
    await chip!.trigger('click')
    expect(w.findAll('.seg').length).toBe(6)
  })
  it('完全未知输入明说未收录', async () => {
    const w = mounted()
    await submit(w, 'ZZZZZZ')
    expect(w.text()).toContain('未收录')
    expect(w.findAll('button.chip')).toHaveLength(0)
  })
})
