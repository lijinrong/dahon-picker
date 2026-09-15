// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WizardFlow from '../../src/components/WizardFlow.vue'
import { mkBike, mkAnswers } from '../helpers'
import { encodeAnswers } from '../../src/lib/urlState'

const assign = vi.fn()
const replace = vi.fn()

describe('WizardFlow(result 模式)', () => {
  beforeEach(() => {
    assign.mockClear()
    replace.mockClear()
  })

  it('合法参数:渲染推荐结果', async () => {
    const search = '?' + encodeAnswers(mkAnswers())
    vi.stubGlobal('location', { assign, replace, search, pathname: '/result' })
    const w = mount(WizardFlow, { props: { mode: 'result', bikes: [mkBike()] } })
    await new Promise((r) => setTimeout(r))
    expect(w.text()).toContain('推荐')
  })
  it('非法参数:重定向回首页', async () => {
    vi.stubGlobal('location', { assign, replace, search: '?b=xxx', pathname: '/result' })
    mount(WizardFlow, { props: { mode: 'result', bikes: [mkBike()] } })
    await new Promise((r) => setTimeout(r))
    expect(replace).toHaveBeenCalledWith('/')
  })
})
