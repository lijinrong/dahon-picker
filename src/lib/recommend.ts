import type { Bike } from './schema'
import { BUDGET_MAX, HEIGHT_MID, type Answers } from './answers'

const FOLD_W = { daily: 3, occasional: 1.5, rarely: 0.3 } as const
const CLIMB_W = { sport: 2.5, commute: 1.2, travel: 1, casual: 0.4 } as const
const TOP_N = 4

export interface Recommendation {
  bike: Bike
  score: number
}

export interface RankedResult {
  mode: 'strict' | 'relaxed'
  relaxedDimensions: Array<'budget' | 'height'>
  recommendations: Recommendation[]
}

function heightOk(bike: Bike, a: Answers): boolean {
  const [lo, hi] = bike.heightRangeCm
  const mid = HEIGHT_MID[a.height]
  return mid >= lo && mid <= hi
}

function priceOk(bike: Bike, a: Answers): boolean {
  return bike.priceCny <= BUDGET_MAX[a.budget] * 1.1
}

function scoreOf(bike: Bike, a: Answers): number {
  const useMatch = bike.useCases.includes(a.useCase) ? 10 : 0
  const carry = bike.folding.carryScore * FOLD_W[a.fold]
  const climb = bike.drivetrain.climbScore * CLIMB_W[a.useCase]
  const travelBonus = a.useCase === 'travel' ? Math.max(0, 12 - bike.weightKg) * 1.5 : 0
  return useMatch + carry + climb + travelBonus
}

function rank(pool: Bike[], a: Answers): Recommendation[] {
  return pool
    .map((bike) => ({ bike, score: scoreOf(bike, a) }))
    .sort(
      (x, y) =>
        y.score - x.score ||
        x.bike.priceCny - y.bike.priceCny ||
        x.bike.slug.localeCompare(y.bike.slug),
    )
    .slice(0, TOP_N)
}

export function recommend(answers: Answers, all: Bike[]): RankedResult {
  const active = all.filter((b) => b.status === 'active')
  const strict = active.filter((b) => priceOk(b, answers) && heightOk(b, answers))
  if (strict.length > 0) {
    return { mode: 'strict', relaxedDimensions: [], recommendations: rank(strict, answers) }
  }
  const heightOkPool = active.filter((b) => heightOk(b, answers))
  if (heightOkPool.length > 0) {
    return { mode: 'relaxed', relaxedDimensions: ['budget'], recommendations: rank(heightOkPool, answers) }
  }
  const priceOkPool = active.filter((b) => priceOk(b, answers))
  if (priceOkPool.length > 0) {
    return { mode: 'relaxed', relaxedDimensions: ['height'], recommendations: rank(priceOkPool, answers) }
  }
  return { mode: 'relaxed', relaxedDimensions: ['budget', 'height'], recommendations: rank(active, answers) }
}
