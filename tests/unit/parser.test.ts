import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { mergeListingWithDetailHtml, parseListingsFromHtml } from '../../scripts/scraper/parser'

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
    assert.equal(listings[0].costs.rent, 2000)
    assert.equal(listings[0].costs.monthlyTotal, 2446)
    assert.equal(listings[0].costs.monthlyTotalConfidence, 'confirmed')
  })

  it('usa o custo total exibido pelo QuintoAndar quando disponivel', () => {
    const html = `
      <article>
        <a href="/imovel/893197833/alugar/apartamento-2-quartos-santa-tereza-belo-horizonte">
          Em breveApartamento para alugar em Santa Tereza, 2 quartos, aceita animais.
          R$ 3.500 aluguel
          R$ 4.984 total
          110 m2 · 2 quartos · 2 vagas
          Rua Hermilo Alves, Santa Tereza · Belo Horizonte
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
    assert.equal(listings[0].costs.rent, 3500)
    assert.equal(listings[0].costs.monthlyTotal, 4984)
    assert.equal(listings[0].costs.monthlyTotalConfidence, 'confirmed')
  })

  it('enriquece anuncio do QuintoAndar com composicao de custos da pagina de detalhe', () => {
    const html = `
      <article>
        <a href="/imovel/893463643/alugar/apartamento-1-quarto-santa-tereza-belo-horizonte">
          Apartamento mobiliado para alugar em Santa Tereza.
          R$ 2.000 aluguel
          R$ 2.446 total
          30 m2 Â· 1 quarto Â· 1 vaga
        </a>
      </article>
    `
    const [listing] = parseListingsFromHtml({
      html,
      source: 'QuintoAndar',
      transaction: 'rent',
      pageUrl: 'https://www.quintoandar.com.br/alugar/imovel/santa-teresa-belo-horizonte-mg-brasil/apartamento',
      maxListings: 5,
    })

    const enriched = mergeListingWithDetailHtml(
      listing,
      `
        <main>
          <h1>Aluguel R$ 2.000</h1>
          <nav>Condominio anunciado em outro bloco R$ 12.900</nav>
          <aside>
            Aluguel R$ 2.000
            Condominio R$ 330
            IPTU R$ 38
            Seguro incendio R$ 27
            Taxa de servico R$ 51
            Total R$ 2.446
            Conteudo informativo R$ 2.265 mensais
            Outro anuncio recomendado R$ 2.265 total
          </aside>
          <section>Rua Cristal, Santa Tereza, Belo Horizonte</section>
        </main>
      `,
    )

    assert.equal(enriched.costs.rent, 2000)
    assert.equal(enriched.costs.condominium, 330)
    assert.equal(enriched.costs.iptu, 38)
    assert.equal(enriched.costs.insurance, 27)
    assert.equal(enriched.costs.other, 51)
    assert.equal(enriched.costs.monthlyTotal, 2446)
    assert.equal(enriched.costs.monthlyTotalConfidence, 'confirmed')
    assert.equal(enriched.address, 'Rua Cristal')
  })
})
