import type { Bike } from './schema'
import type { UseCase } from './answers'

export interface BikeFilter {
  wheelSize?: number
  priceMin?: number
  priceMax?: number
  useCase?: UseCase
  minSpeeds?: number
}

export type SortKey = 'price-asc' | 'price-desc' | 'weight-asc'

export function filterBikes(bikes: Bike[], f: BikeFilter): Bike[] {
  return bikes.filter(
    (b) =>
      b.status === 'active' &&
      (f.wheelSize === undefined || b.wheelSize === f.wheelSize) &&
      (f.priceMin === undefined || b.priceCny >= f.priceMin) &&
      (f.priceMax === undefined || b.priceCny <= f.priceMax) &&
      (f.useCase === undefined || b.useCases.includes(f.useCase)) &&
      (f.minSpeeds === undefined || b.drivetrain.speeds >= f.minSpeeds),
  )
}

export function sortBikes(bikes: Bike[], key: SortKey): Bike[] {
  const copy = [...bikes]
  if (key === 'price-asc') copy.sort((a, b) => a.priceCny - b.priceCny)
  if (key === 'price-desc') copy.sort((a, b) => b.priceCny - a.priceCny)
  if (key === 'weight-asc') copy.sort((a, b) => a.weightKg - b.weightKg)
  return copy
}
