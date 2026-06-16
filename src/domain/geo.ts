import { DEFAULT_RADIUS_KM, NEIGHBORHOOD_COORDINATES, SEARCH_CENTER } from './config'
import type { Coordinates, DataConfidence } from './types'

const EARTH_RADIUS_KM = 6371

export function haversineDistanceKm(from: Coordinates, to: Coordinates): number {
  const latDistance = toRadians(to.lat - from.lat)
  const lonDistance = toRadians(to.lon - from.lon)
  const fromLat = toRadians(from.lat)
  const toLat = toRadians(to.lat)

  const a =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lonDistance / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function inferCoordinatesFromNeighborhood(
  neighborhood?: string,
): { coordinates?: Coordinates; confidence: DataConfidence } {
  if (!neighborhood) {
    return { confidence: 'missing' }
  }

  const key = normalizeNeighborhood(neighborhood)
  const coordinates = NEIGHBORHOOD_COORDINATES[key]

  if (!coordinates) {
    return { confidence: 'missing' }
  }

  return { coordinates, confidence: 'estimated' }
}

export function distanceFromCenter(coordinates?: Coordinates): number | undefined {
  if (!coordinates) {
    return undefined
  }

  return roundDistance(haversineDistanceKm(SEARCH_CENTER.coordinates, coordinates))
}

export function isInsideDefaultRadius(distanceKm?: number): boolean {
  return typeof distanceKm === 'number' && distanceKm <= DEFAULT_RADIUS_KM
}

export function roundDistance(distanceKm: number): number {
  return Math.round(distanceKm * 10) / 10
}

export function normalizeNeighborhood(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180
}
