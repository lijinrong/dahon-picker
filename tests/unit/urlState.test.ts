import { describe, expect, it } from 'vitest'
import { encodeAnswers, parseAnswers, parseIds } from '../../src/lib/urlState'
import { mkAnswers } from '../helpers'

describe('encodeAnswers / parseAnswers', () => {
  it('编解码往返一致,参数键为 b/u/f/h', () => {
    const a = mkAnswers()
    expect(encodeAnswers(a)).toBe('b=2000-4000&u=commute&f=daily&h=170-180')
    expect(parseAnswers('?' + encodeAnswers(a))).toEqual(a)
    expect(parseAnswers(encodeAnswers(a))).toEqual(a)
  })
  it('缺少任一参数返回 null', () => {
    expect(parseAnswers('b=2000-4000&u=commute&f=daily')).toBeNull()
  })
  it('枚举值非法返回 null', () => {
    expect(parseAnswers('b=9999-1&u=commute&f=daily&h=170-180')).toBeNull()
    expect(parseAnswers('b=2000-4000&u=fly&f=daily&h=170-180')).toBeNull()
  })
  it('多余参数被忽略', () => {
    expect(parseAnswers('?b=2000-4000&u=commute&f=daily&h=170-180&x=1')).toEqual(mkAnswers())
  })
  it('空串返回 null', () => {
    expect(parseAnswers('')).toBeNull()
  })
})

describe('parseIds(对比页)', () => {
  it('解析去重并截断到 3 个', () => {
    expect(parseIds('?ids=aaa,bbb,aaa,ccc,ddd')).toEqual(['aaa', 'bbb', 'ccc'])
  })
  it('无参数返回空数组', () => {
    expect(parseIds('')).toEqual([])
  })
})
