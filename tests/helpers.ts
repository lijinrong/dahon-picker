import type { Answers } from '../src/lib/answers'
import type { Bike } from '../src/lib/schema'

export function mkBike(overrides: Partial<Bike> = {}): Bike {
  return {
    slug: 'test-bike',
    model: 'TEST01',
    marketingName: '测试车',
    series: 'T',
    status: 'active',
    discontinuedInfo: null,
    wheelSize: 20,
    weightKg: 11,
    folding: { mechanism: '磁吸快折', foldedSize: '35×70×75cm', carryScore: 4 },
    drivetrain: { speeds: 8, climbScore: 3 },
    priceCny: 3000,
    priceUpdatedAt: '2026-09-14',
    heightRangeCm: [155, 185],
    useCases: ['commute'],
    highlights: ['测试亮点'],
    pros: ['优点一'],
    cons: ['缺点一'],
    nameDecodeOverride: null,
    specs: { 车架: '铝合金' },
    affiliateUrl: null,
    sources: ['来源A', '来源B'],
    updatedAt: '2026-09-14',
    ...overrides,
  }
}

export function mkAnswers(overrides: Partial<Answers> = {}): Answers {
  return {
    budget: '2000-4000',
    useCase: 'commute',
    fold: 'daily',
    height: '170-180',
    ...overrides,
  }
}
