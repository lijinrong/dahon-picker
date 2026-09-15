import { describe, expect, it } from 'vitest'
import { loadBikes, loadNaming } from '../../src/lib/schema'
import { decodeModel } from '../../src/lib/decode'

describe('naming.json 规则表', () => {
  const naming = loadNaming()
  const bikes = loadBikes()

  it('全部在售车型的官方代码可被解读(字母位无 null,数字位或例外必须有覆盖)', () => {
    for (const b of bikes) {
      const r = decodeModel(b.model, naming, bikes)
    expect(r.matched).toBe(true)
    const nullLetters = r.segments.filter((s) => s.meaning === null && /[A-Z]/.test(s.char))
    expect(nullLetters, `${b.model} 存在未解读的字母位`).toHaveLength(0)
    }
  })
  it('俗称映射指向存在的 slug', () => {
    const slugs = new Set(bikes.map((b) => b.slug))
    for (const slug of Object.values(naming.nicknames)) {
      expect(slugs.has(slug), `nickname 指向不存在的 slug: ${slug}`).toBe(true)
    }
  })
  it('常见俗称已收录(K3/P8/D8 至少其二)', () => {
    const known = Object.keys(naming.nicknames)
    expect(['K3', 'P8', 'D8'].filter((k) => known.includes(k)).length).toBeGreaterThanOrEqual(2)
  })
})
