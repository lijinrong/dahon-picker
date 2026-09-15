import type { Bike, Naming } from './schema'

export interface DecodeSegment {
  index: number
  char: string
  meaning: string | null
  note?: string
}

export interface DecodeResult {
  input: string
  matched: boolean
  viaNickname: string | null
  slug: string | null
  segments: DecodeSegment[]
  suggestions: string[]
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const curr = [i]
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    prev = curr
  }
  return prev[n]
}

function resolveModel(
  input: string,
  naming: Naming,
  bikes: Bike[],
): { code: string; slug: string; viaNickname: string | null } | null {
  const direct = bikes.find((b) => b.model === input)
  if (direct) return { code: direct.model, slug: direct.slug, viaNickname: null }
  const nickSlug = naming.nicknames[input]
  if (nickSlug) {
    const b = bikes.find((x) => x.slug === nickSlug)
    if (b) return { code: b.model, slug: b.slug, viaNickname: input }
  }
  return null
}

export function decodeModel(rawInput: string, naming: Naming, bikes: Bike[]): DecodeResult {
  const input = rawInput.trim().toUpperCase()
  const resolved = resolveModel(input, naming, bikes)
  if (!resolved) {
    const known = [...bikes.map((b) => b.model), ...Object.keys(naming.nicknames)]
    const suggestions = [...new Set(known.filter((k) => levenshtein(input, k) <= 2))]
      .sort((a, b) => levenshtein(input, a) - levenshtein(input, b))
      .slice(0, 3)
    return { input: rawInput, matched: false, viaNickname: null, slug: null, segments: [], suggestions }
  }
  const bike = bikes.find((b) => b.slug === resolved.slug)
  const override = bike?.nameDecodeOverride ?? null
  const segments: DecodeSegment[] = resolved.code.split('').map((char, index) => {
    if (override) {
      const hit = override.find((o) => o.char === char)
      if (hit) return { index, char, meaning: hit.meaning }
    }
    const pos = naming.positions.find((p) => p.index === index)
    const meaning = pos && pos.map[char] ? pos.map[char] : null
    if (meaning === null) return { index, char, meaning, note: '未识别(官方未公开统一规则)' }
    return { index, char, meaning }
  })
  return { input: rawInput, matched: true, viaNickname: resolved.viaNickname, slug: resolved.slug, segments, suggestions: [] }
}
