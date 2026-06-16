import { isInsideDefaultRadius } from './geo'
import type { Listing } from './types'

export type PriceBand = 'ate-500k' | '500k-800k' | '800k-1m2' | '1m2-1m8' | 'acima-1m8' | 'sem-preco'

export function scoreListing(listing: Listing): number {
  let score = 0

  if (isInsideDefaultRadius(listing.distanceKm)) {
    score += listing.distanceConfidence === 'confirmed' ? 30 : 22
  }

  if (listing.parkingSpaces && listing.parkingSpaces >= 2) {
    score += 22
  } else if (listing.parkingSpaces === 1) {
    score += 7
  }

  if (listing.isNewOrRenovated) {
    score += 16
  }

  if (listing.costs.monthlyTotalConfidence === 'confirmed') {
    score += 12
  } else if (listing.costs.monthlyTotalConfidence === 'estimated') {
    score += 7
  }

  if (listing.costs.pricePerSquareMeter && listing.costs.pricePerSquareMeter < 9500) {
    score += 7
  }

  if (listing.images.length > 0) {
    score += 4
  }

  if (listing.contactName || listing.contactPhone) {
    score += 4
  }

  if (listing.sourceListingId) {
    score += 3
  }

  if (listing.distanceKm) {
    score += Math.max(0, 8 - listing.distanceKm)
  }

  return Math.round(score)
}

export function sortByCostBenefit(listings: Listing[]): Listing[] {
  return [...listings].sort((a, b) => {
    const scoreDiff = scoreListing(b) - scoreListing(a)
    if (scoreDiff !== 0) {
      return scoreDiff
    }

    const aPrice = a.transaction === 'rent' ? a.costs.monthlyTotal : a.costs.salePrice
    const bPrice = b.transaction === 'rent' ? b.costs.monthlyTotal : b.costs.salePrice

    if (typeof aPrice === 'number' && typeof bPrice === 'number' && aPrice !== bPrice) {
      return aPrice - bPrice
    }

    return (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY)
  })
}

export function salePriceBand(listing: Listing): PriceBand {
  const price = listing.costs.salePrice

  if (typeof price !== 'number') {
    return 'sem-preco'
  }

  if (price <= 500000) return 'ate-500k'
  if (price <= 800000) return '500k-800k'
  if (price <= 1200000) return '800k-1m2'
  if (price <= 1800000) return '1m2-1m8'
  return 'acima-1m8'
}

export function priceBandLabel(band: PriceBand): string {
  const labels: Record<PriceBand, string> = {
    'ate-500k': 'Ate R$ 500 mil',
    '500k-800k': 'R$ 500 mil a R$ 800 mil',
    '800k-1m2': 'R$ 800 mil a R$ 1,2 mi',
    '1m2-1m8': 'R$ 1,2 mi a R$ 1,8 mi',
    'acima-1m8': 'Acima de R$ 1,8 mi',
    'sem-preco': 'Preco nao informado',
  }

  return labels[band]
}
