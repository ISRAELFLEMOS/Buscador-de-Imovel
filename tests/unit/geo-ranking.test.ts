import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { SEARCH_CENTER } from '../../src/domain/config'
import { distanceFromCenter, haversineDistanceKm } from '../../src/domain/geo'
import { scoreListing, sortByCostBenefit } from '../../src/domain/ranking'
import type { Listing } from '../../src/domain/types'

const listing: Listing = {
  id: 'a',
  source: 'Outro',
  sourceListingId: 'AP123',
  url: 'https://example.com/a',
  title: 'Apartamento reformado',
  transaction: 'sale',
  neighborhood: 'Funcionários',
  coordinates: { lat: -19.9322, lon: -43.9298 },
  distanceKm: 0.5,
  distanceConfidence: 'estimated',
  parkingSpaces: 2,
  isNewOrRenovated: true,
  images: ['https://example.com/a.jpg'],
  costs: {
    salePrice: 700000,
    monthlyTotalConfidence: 'missing',
  },
  collectedAt: '2026-06-15T00:00:00.000Z',
  warnings: [],
}

describe('geo e ranking', () => {
  it('calcula distancia Haversine de forma estavel', () => {
    assert.equal(Number(haversineDistanceKm(SEARCH_CENTER.coordinates, SEARCH_CENTER.coordinates).toFixed(3)), 0)
    assert.ok((distanceFromCenter({ lat: -19.9322, lon: -43.9298 }) ?? 99) < 1)
  })

  it('prioriza duas vagas e reforma', () => {
    const weak = { ...listing, id: 'b', parkingSpaces: 1, isNewOrRenovated: false }

    assert.ok(scoreListing(listing) > scoreListing(weak))
    assert.equal(sortByCostBenefit([weak, listing])[0].id, 'a')
  })
})
