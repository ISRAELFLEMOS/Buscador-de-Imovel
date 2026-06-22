import { DEFAULT_MAX_RENT_TOTAL, DEFAULT_RADIUS_KM, PREFERRED_NEIGHBORHOODS } from './config'
import { sortNeighborhoodNames } from './neighborhoods'
import type { Listing, ListingSource, TransactionType } from './types'

export type ListingSortMode = 'best' | 'price-asc' | 'distance-asc' | 'area-desc' | 'newest'

export interface ListingFilters {
  transaction: TransactionType | 'all'
  minParkingSpaces: number
  onlyTwoPlusParking: boolean
  onlyNewOrRenovated: boolean
  onlyKnownTotal: boolean
  strictRadius: boolean
  neighborhoods: string[]
  sources: ListingSource[]
  query: string
  maxRentTotal: number
  maxSalePrice: number
  minBedrooms: number
  minAreaM2: number
  sortBy: ListingSortMode
}

export const DEFAULT_FILTERS: ListingFilters = {
  transaction: 'rent',
  minParkingSpaces: 0,
  onlyTwoPlusParking: false,
  onlyNewOrRenovated: false,
  onlyKnownTotal: false,
  strictRadius: false,
  neighborhoods: [],
  sources: [],
  query: '',
  maxRentTotal: DEFAULT_MAX_RENT_TOTAL,
  maxSalePrice: 0,
  minBedrooms: 0,
  minAreaM2: 0,
  sortBy: 'best',
}

export function filterListings(listings: Listing[], filters: ListingFilters): Listing[] {
  const query = normalize(filters.query)

  return listings.filter((listing) => {
    if (filters.transaction !== 'all' && listing.transaction !== filters.transaction) {
      return false
    }

    if (listing.transaction === 'rent' && filters.maxRentTotal > 0) {
      const rentTotal = listing.costs.monthlyTotal ?? listing.costs.rent
      if (typeof rentTotal !== 'number' || rentTotal > filters.maxRentTotal) {
        return false
      }
    }

    if ((listing.parkingSpaces ?? 0) < filters.minParkingSpaces) {
      return false
    }

    if (filters.onlyTwoPlusParking && (listing.parkingSpaces ?? 0) < 2) {
      return false
    }

    if ((listing.bedrooms ?? 0) < filters.minBedrooms) {
      return false
    }

    if ((listing.areaM2 ?? 0) < filters.minAreaM2) {
      return false
    }

    if (filters.onlyNewOrRenovated && !listing.isNewOrRenovated) {
      return false
    }

    if (
      filters.onlyKnownTotal &&
      listing.transaction === 'rent' &&
      (listing.costs.monthlyTotalConfidence !== 'confirmed' || typeof listing.costs.monthlyTotal !== 'number')
    ) {
      return false
    }

    if (
      listing.transaction === 'sale' &&
      filters.maxSalePrice > 0 &&
      (typeof listing.costs.salePrice !== 'number' || listing.costs.salePrice > filters.maxSalePrice)
    ) {
      return false
    }

    if (filters.strictRadius) {
      if (typeof listing.distanceKm !== 'number' || listing.distanceKm > DEFAULT_RADIUS_KM) {
        return false
      }
    }

    if (filters.neighborhoods.length > 0) {
      const neighborhood = normalize(listing.neighborhood ?? '')
      const accepted = filters.neighborhoods.map(normalize)
      if (!accepted.includes(neighborhood)) {
        return false
      }
    }

    if (filters.sources.length > 0 && !filters.sources.includes(listing.source)) {
      return false
    }

    if (query) {
      const haystack = normalize(
        [listing.title, listing.neighborhood, listing.address, listing.source, listing.rawText].join(' '),
      )
      if (!haystack.includes(query)) {
        return false
      }
    }

    return true
  })
}

export function uniqueNeighborhoods(listings: Listing[]): string[] {
  const neighborhoods = Array.from(
    new Set([
      ...PREFERRED_NEIGHBORHOODS,
      ...listings.map((listing) => listing.neighborhood).filter((item): item is string => Boolean(item)),
    ]),
  )

  return sortNeighborhoodNames(neighborhoods)
}

export function uniqueSources(listings: Listing[]): ListingSource[] {
  return Array.from(new Set(listings.map((listing) => listing.source))).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
