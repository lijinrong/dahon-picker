export const BUDGETS = ['under-2000', '2000-4000', '4000-8000', 'over-8000'] as const
export const USE_CASES = ['commute', 'sport', 'travel', 'casual'] as const
export const FOLD_FREQUENCIES = ['daily', 'occasional', 'rarely'] as const
export const HEIGHT_BANDS = ['under-160', '160-170', '170-180', 'over-180'] as const

export type Budget = (typeof BUDGETS)[number]
export type UseCase = (typeof USE_CASES)[number]
export type FoldFrequency = (typeof FOLD_FREQUENCIES)[number]
export type HeightBand = (typeof HEIGHT_BANDS)[number]

export interface Answers {
  budget: Budget
  useCase: UseCase
  fold: FoldFrequency
  height: HeightBand
}

export const BUDGET_MAX: Record<Budget, number> = {
  'under-2000': 2000,
  '2000-4000': 4000,
  '4000-8000': 8000,
  'over-8000': Number.POSITIVE_INFINITY,
}

export const HEIGHT_MID: Record<HeightBand, number> = {
  'under-160': 158,
  '160-170': 165,
  '170-180': 175,
  'over-180': 183,
}

export const BUDGET_LABEL: Record<Budget, string> = {
  'under-2000': '2000 元以内',
  '2000-4000': '2000-4000 元',
  '4000-8000': '4000-8000 元',
  'over-8000': '8000 元以上',
}
export const USE_CASE_LABEL: Record<UseCase, string> = {
  commute: '城市通勤',
  sport: '运动健身',
  travel: '旅行携车',
  casual: '休闲代步',
}
export const FOLD_LABEL: Record<FoldFrequency, string> = {
  daily: '每天都要折',
  occasional: '偶尔折',
  rarely: '基本不折',
}
export const HEIGHT_LABEL: Record<HeightBand, string> = {
  'under-160': '160cm 以下',
  '160-170': '160-170cm',
  '170-180': '170-180cm',
  'over-180': '180cm 以上',
}

export const WIZARD_QUESTIONS = [
  { key: 'budget', title: '你的预算大概是?', options: BUDGETS.map((v) => ({ value: v, label: BUDGET_LABEL[v] })) },
  { key: 'useCase', title: '主要用来做什么?', options: USE_CASES.map((v) => ({ value: v, label: USE_CASE_LABEL[v] })) },
  { key: 'fold', title: '多久折叠一次车?', options: FOLD_FREQUENCIES.map((v) => ({ value: v, label: FOLD_LABEL[v] })) },
  { key: 'height', title: '你的身高?', options: HEIGHT_BANDS.map((v) => ({ value: v, label: HEIGHT_LABEL[v] })) },
] as const
