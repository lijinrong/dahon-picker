import type { Bike } from './schema'

export interface PriceDelta {
  amount: number
  direction: 'up' | 'down' | 'same'
  label: string
}

/**
 * Compute the price change from the most recent history entry to current price.
 */
export function priceDelta(bike: Bike): PriceDelta | null {
  if (!bike.priceHistory.length) return null
  // History is oldest-first; compare last entry to current
  const prev = bike.priceHistory[bike.priceHistory.length - 1]
  const diff = bike.priceCny - prev.price
  if (diff === 0) return null
  const direction = diff > 0 ? 'up' : 'down'
  const abs = Math.abs(diff)
  const label = direction === 'up' ? `+¥${abs}` : `-¥${abs}`
  return { amount: diff, direction, label }
}
