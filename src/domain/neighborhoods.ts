import {
  PREFERRED_NEIGHBORHOODS,
  PRIMARY_PREFERRED_NEIGHBORHOODS,
  SECONDARY_PREFERRED_NEIGHBORHOODS,
} from './config'
import { normalizeNeighborhood } from './geo'

export type NeighborhoodPreferenceTier = 0 | 1 | 2

const primarySet = new Set(PRIMARY_PREFERRED_NEIGHBORHOODS.map(normalizeNeighborhood))
const secondarySet = new Set(SECONDARY_PREFERRED_NEIGHBORHOODS.map(normalizeNeighborhood))
const preferredOrder = new Map(
  PREFERRED_NEIGHBORHOODS.map((neighborhood, index) => [normalizeNeighborhood(neighborhood), index]),
)

export function neighborhoodPreferenceTier(neighborhood?: string): NeighborhoodPreferenceTier {
  if (!neighborhood) {
    return 2
  }

  const key = normalizeNeighborhood(neighborhood)
  if (primarySet.has(key)) {
    return 0
  }
  if (secondarySet.has(key)) {
    return 1
  }

  return 2
}

export function neighborhoodPreferenceBonus(neighborhood?: string): number {
  const tier = neighborhoodPreferenceTier(neighborhood)
  if (tier === 0) return 24
  if (tier === 1) return 14
  return 0
}

export function neighborhoodPreferenceLabel(neighborhood: string): string | undefined {
  const tier = neighborhoodPreferenceTier(neighborhood)
  if (tier === 0) return 'Prioridade maxima'
  if (tier === 1) return 'Preferido'
  return undefined
}

export function sortNeighborhoodNames(neighborhoods: string[]): string[] {
  return [...neighborhoods].sort((a, b) => {
    const tierDiff = neighborhoodPreferenceTier(a) - neighborhoodPreferenceTier(b)
    if (tierDiff !== 0) {
      return tierDiff
    }

    const aOrder = preferredOrder.get(normalizeNeighborhood(a))
    const bOrder = preferredOrder.get(normalizeNeighborhood(b))
    if (aOrder !== undefined || bOrder !== undefined) {
      return (aOrder ?? Number.POSITIVE_INFINITY) - (bOrder ?? Number.POSITIVE_INFINITY)
    }

    return a.localeCompare(b, 'pt-BR')
  })
}
