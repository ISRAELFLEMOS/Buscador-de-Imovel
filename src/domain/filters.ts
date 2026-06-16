import { DEFAULT_MAX_RENT_TOTAL, DEFAULT_RADIUS_KM } from './config'
import type { Listing, TransactionType } from './types'

export interface ListingFilters {
  transaction: TransactionType | 'all'
  minParkingSpaces: number
  onlyNewOrRenovated: boolean
  strictRadius: boolean
  neighborhoods: string[]
  query: string
  maxRentTotal: number
}

export const DEFAULT_FILTERS: ListingFilters = {
  transaction: 'rent',
  minParkingSpaces: 0,
  onlyNewOrRenovated: false,
  strictRadius: false,
  neighborhoods: [],
  query: '',
  maxRentTotal: DEFAULT_MAX_RENT_TOTAL,
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

    if (filters.onlyNewOrRenovated && !listing.isNewOrRenovated) {
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
  return Array.from(
    new Set(listings.map((listing) => listing.neighborhood).filter((item): item is string => Boolean(item))),
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
