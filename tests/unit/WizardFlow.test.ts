// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WizardFlow from '../../src/components/WizardFlow.vue'

const assign = vi.fn()
const replace = vi.fn()

describe('WizardFlow(quiz 模式)', () => {
  beforeEach(() => {
    assign.mockClear()
    replace.mockClear()
    vi.stubGlobal('location', { assign, replace, search: '', pathname: '/' })
  })

  it('逐题作答,答完第 4 题跳转 /result 并携带编码参数', async () => {
    const w = mount(WizardFlow, { props: { mode: 'quiz' } })
    const labels = ['2000-4000 元', '城市通勤', '每天都要折', '170-180cm']
    for (const label of labels) {
      const btn = w.findAll('button.option-btn').find((b) => b.text() === label)
      expect(btn, `找不到选项按钮:${label}`).toBeTruthy()
      await btn!.trigger('click')
    }
    expect(assign).toHaveBeenCalledWith('/result?b=2000-4000&u=commute&f=daily&h=170-180')
  })

  it('支持返回上一题', async () => {
    const w = mount(WizardFlow, { props: { mode: 'quiz' } })
    await w.findAll('button.option-btn')[0].trigger('click')
    expect(w.text()).toContain('主要用来做什么?')
    await w.find('button.btn-ghost').trigger('click')
    expect(w.text()).toContain('你的预算大概是?')
  })

  it('进度条随步骤前进', async () => {
    const w = mount(WizardFlow, { props: { mode: 'quiz' } })
    const fill = () => w.find('.wizard-progress-fill')
    expect(fill().attributes('style')).toContain('width: 25%')
    await w.findAll('button.option-btn')[0].trigger('click')
    expect(fill().attributes('style')).toContain('width: 50%')
  })
})
