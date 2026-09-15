import {
  BUDGETS,
  FOLD_FREQUENCIES,
  HEIGHT_BANDS,
  USE_CASES,
  type Answers,
} from './answers'

const KEYS = { budget: 'b', useCase: 'u', fold: 'f', height: 'h' } as const

export function encodeAnswers(a: Answers): string {
  const p = new URLSearchParams()
  p.set(KEYS.budget, a.budget)
  p.set(KEYS.useCase, a.useCase)
  p.set(KEYS.fold, a.fold)
  p.set(KEYS.height, a.height)
  return p.toString()
}

export function parseAnswers(search: string): Answers | null {
  const p = new URLSearchParams(search)
  const budget = p.get(KEYS.budget)
  const useCase = p.get(KEYS.useCase)
  const fold = p.get(KEYS.fold)
  const height = p.get(KEYS.height)
  if (!budget || !useCase || !fold || !height) return null
  if (!BUDGETS.includes(budget as never)) return null
  if (!USE_CASES.includes(useCase as never)) return null
  if (!FOLD_FREQUENCIES.includes(fold as never)) return null
  if (!HEIGHT_BANDS.includes(height as never)) return null
  return { budget, useCase, fold, height } as Answers
}

export function parseIds(search: string): string[] {
  const raw = new URLSearchParams(search).get('ids') ?? ''
  return [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))].slice(0, 3)
}
