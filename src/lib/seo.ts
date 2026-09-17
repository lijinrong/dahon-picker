import type { Bike } from './schema'

const SITE = 'https://jrli.github.io'
const BASE = '/dahon-picker/'

export function canonicalUrl(pathname: string): string {
  return `${SITE}${BASE}${pathname.replace(/^\//, '')}`
}

export function websiteJsonLd(title: string, url: string): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: title,
    url,
  })
}

export function productJsonLd(bike: Bike, url: string): string {
  const availability =
    bike.status === 'active'
      ? 'https://schema.org/InStock'
      : 'https://schema.org/Discontinued'
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${bike.model} ${bike.marketingName}`,
    description: bike.highlights.join('；'),
    brand: { '@type': 'Brand', name: 'DAHON' },
    sku: bike.model,
    offers: {
      '@type': 'Offer',
      price: bike.priceCny,
      priceCurrency: 'CNY',
      availability,
      url,
      priceValidUntil: bike.priceUpdatedAt,
    },
  })
}
