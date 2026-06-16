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
    assert.equal(listings[0].neighborhood, 'Funcionarios')
    assert.equal(listings[0].costs.monthlyTotal, 5700)
  })

  it('normaliza Santa Tereza como Santa Teresa', () => {
    const html = `
      <article>
        <a href="/imovel/895000001/alugar/apartamento-1-quarto-santa-tereza-belo-horizonte">
          Apartamento para alugar em Santa Tereza
          R$ 2.000 aluguel
          R$ 2.446 total
          30 m2 · 1 quarto · 1 vaga
          Rua Cristal, Santa Tereza · Belo Horizonte
        </a>
      </article>
    `
    const listings = parseListingsFromHtml({
      html,
      source: 'QuintoAndar',
      transaction: 'rent',
      pageUrl: 'https://www.quintoandar.com.br/alugar/imovel/santa-teresa-belo-horizonte-mg-brasil/apartamento',
      maxListings: 5,
    })

    assert.equal(listings.length, 1)
    assert.equal(listings[0].neighborhood, 'Santa Teresa')
  })
})
