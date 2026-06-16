import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { parseListingsFromHtml } from '../../scripts/scraper/parser'

describe('parser de anuncios', () => {
  it('extrai custo mensal, vagas, bairro e codigo quando visiveis', () => {
    const html = readFileSync('scripts/scraper/fixtures/listing-card.html', 'utf8')
    const listings = parseListingsFromHtml({
      html,
      source: 'Outro',
      transaction: 'rent',
      pageUrl: 'https://www.example.com/busca',
      maxListings: 5,
    })

    assert.equal(listings.length, 1)
    assert.equal(listings[0].sourceListingId, 'AP1234')
    assert.equal(listings[0].parkingSpaces, 2)
    assert.equal(listings[0].neighborhood, 'Funcionários')
    assert.equal(listings[0].costs.monthlyTotal, 5700)
  })
})
