import { z } from 'zod'
import bikesJson from '../data/bikes.json'
import namingJson from '../data/naming.json'

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须为 YYYY-MM-DD')

export const bikeSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug 只允许小写字母数字和连字符'),
    model: z.string().regex(/^[A-Z][A-Z0-9]{2,}$/, '官方代码应为全大写字母数字,至少 3 位'),
    marketingName: z.string().min(1),
    series: z.string().length(1),
    status: z.enum(['active', 'discontinued']),
    discontinuedInfo: z
      .object({
        lastPriceCny: z.number().int().positive(),
        year: z.number().int().min(1990).max(2100),
      })
      .nullable(),
    wheelSize: z.number().int().min(14).max(32),
    weightKg: z.number().positive().max(25),
    folding: z.object({
      mechanism: z.string().min(1),
      foldedSize: z.string().min(1),
      carryScore: z.number().int().min(1).max(5),
    }),
    drivetrain: z.object({
      speeds: z.number().int().min(1).max(33),
      climbScore: z.number().int().min(1).max(5),
    }),
    priceCny: z.number().int().positive().max(200000),
    priceUpdatedAt: dateStr,
    heightRangeCm: z
      .tuple([z.number().int().min(120), z.number().int().max(220)])
      .refine(([lo, hi]) => lo < hi, '身高区间下限必须小于上限'),
    useCases: z.array(z.enum(['commute', 'sport', 'travel', 'casual'])).min(1),
    highlights: z.array(z.string().min(1)).min(1),
    pros: z.array(z.string().min(1)),
    cons: z.array(z.string().min(1)),
    nameDecodeOverride: z
      .array(z.object({ char: z.string().min(1), meaning: z.string().min(1) }))
      .nullable(),
    specs: z.record(z.string()),
    imageUrl: z.string().url().nullable(),
    priceHistory: z
      .array(
        z.object({
          price: z.number().int().positive(),
          date: dateStr,
        })
      )
      .default([]),
    affiliateUrl: z.string().url().nullable(),
    sources: z.array(z.string().min(1)).min(2, '参数/价格需至少 2 个来源交叉验证'),
    updatedAt: dateStr,
  })
  .strict()
  .refine((b) => b.status === 'active' || b.discontinuedInfo !== null, '停产车型必须填 discontinuedInfo')

export const namingSchema = z
  .object({
    positions: z
      .array(
        z.object({
          index: z.number().int().min(0),
          dimension: z.string().min(1),
          map: z.record(z.string()),
        }),
      )
      .min(1),
    nicknames: z.record(z.string()),
    uncertain: z.array(z.object({ note: z.string().min(1) })),
  })
  .strict()

export type Bike = z.infer<typeof bikeSchema>
export type Naming = z.infer<typeof namingSchema>

export function loadBikes(): Bike[] {
  const parsed = z.array(bikeSchema).parse(bikesJson)
  const slugs = new Set<string>()
  for (const b of parsed) {
    if (slugs.has(b.slug)) throw new Error(`slug 重复:${b.slug}`)
    slugs.add(b.slug)
  }
  return parsed
}

export function loadNaming(): Naming {
  return namingSchema.parse(namingJson)
}
