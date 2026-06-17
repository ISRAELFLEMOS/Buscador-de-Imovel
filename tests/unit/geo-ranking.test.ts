import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { SEARCH_CENTER } from '../../src/domain/config'
import { uniqueNeighborhoods } from '../../src/domain/filters'
import { distanceFromCenter, haversineDistanceKm } from '../../src/domain/geo'
import { isSafetyAttentionNeighborhood, neighborhoodPreferenceLabel } from '../../src/domain/neighborhoods'
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

  it('prioriza bairros preferidos da Layza no filtro e ranking', () => {
    const centro: Listing = {
      ...listing,
      id: 'centro',
      transaction: 'rent',
      neighborhood: 'Centro',
      costs: { rent: 1900, monthlyTotal: 1900, monthlyTotalConfidence: 'estimated' },
    }
    const santaTeresa: Listing = {
      ...centro,
      id: 'santa-teresa',
      neighborhood: 'Santa Teresa',
      costs: { rent: 3600, monthlyTotal: 3600, monthlyTotalConfidence: 'estimated' },
    }

    assert.equal(uniqueNeighborhoods([centro])[0], 'Santa Teresa')
    assert.ok(uniqueNeighborhoods([centro]).includes('Floresta'))
    assert.ok(uniqueNeighborhoods([centro]).includes('Sagrada Familia'))
    assert.equal(neighborhoodPreferenceLabel('Floresta'), 'Preferido')
    assert.equal(neighborhoodPreferenceLabel('Sagrada Familia'), 'Preferido')
    assert.ok(scoreListing(santaTeresa) > scoreListing(centro))
    assert.equal(sortByCostBenefit([centro, santaTeresa])[0].id, 'santa-teresa')
  })

  it('marca bairros de atencao para avaliacao de seguranca', () => {
    assert.equal(isSafetyAttentionNeighborhood('Centro'), true)
    assert.equal(isSafetyAttentionNeighborhood('Floresta'), false)
  })
})
