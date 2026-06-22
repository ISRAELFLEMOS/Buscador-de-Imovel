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

  it('coleta multiplas imagens do card quando ficam visiveis', () => {
    const html = `
      <article>
        <a href="/imovel/893000001/alugar/apartamento-1-quarto-floresta-belo-horizonte">
          <img src="https://cdn.example.com/foto-1.webp" />
          <img src="https://cdn.example.com/foto-2.webp" />
          Apartamento para alugar no Floresta
          R$ 2.300 aluguel
          R$ 2.900 total
          45 m2 Â· 1 quarto Â· 1 vaga
        </a>
      </article>
    `
    const listings = parseListingsFromHtml({
      html,
      source: 'QuintoAndar',
      transaction: 'rent',
      pageUrl: 'https://www.quintoandar.com.br/alugar/imovel/floresta-belo-horizonte-mg-brasil/apartamento',
      maxListings: 5,
    })

    assert.equal(listings.length, 1)
    assert.equal(listings[0].neighborhood, 'Floresta')
    assert.deepEqual(listings[0].images, [
      'https://cdn.example.com/foto-1.webp',
      'https://cdn.example.com/foto-2.webp',
    ])
  })

  it('extrai anuncios de venda do Zap e reconhece Sagrada Familia', () => {
    const html = `
      <article>
        <a href="https://www.zapimoveis.com.br/imovel/venda-apartamento-3-quartos-sagrada-familia-belo-horizonte-mg-98m2-id-2886787973/">
          Apartamento a venda com 3 quartos no Sagrada Familia, Belo Horizonte.
          R$ 690.000
          98 m2 - 3 quartos - 2 vagas
          Rua Conselheiro Lafaiete, Sagrada Familia
        </a>
      </article>
    `
    const listings = parseListingsFromHtml({
      html,
      source: 'ZAP Imoveis',
      transaction: 'sale',
      pageUrl: 'https://www.zapimoveis.com.br/venda/apartamentos/mg+belo-horizonte+sagrada-familia/',
      maxListings: 5,
    })

    assert.equal(listings.length, 1)
    assert.equal(listings[0].neighborhood, 'Sagrada Familia')
    assert.equal(listings[0].costs.salePrice, 690000)
    assert.equal(listings[0].sourceListingId, '2886787973')
  })

  it('separa preco de venda quando o portal cola a metragem no valor', () => {
    const html = `
      <article>
        <a href="https://www.example.com/imovel/venda-apartamento-4-quartos-lourdes-belo-horizonte-id-123456789/">
          Venda de apartamento com 4 quartos.
          R$ 4.980.000310 m2 tot.4 quartos5 ban.3 vagas
          Rua Curitiba, Lourdes, Belo Horizonte
        </a>
      </article>
    `
    const listings = parseListingsFromHtml({
      html,
      source: 'Outro',
      transaction: 'sale',
      pageUrl: 'https://www.example.com/venda/apartamentos/',
      maxListings: 5,
    })

    assert.equal(listings.length, 1)
    assert.equal(listings[0].costs.salePrice, 4980000)
    assert.equal(listings[0].areaM2, 310)
    assert.equal(listings[0].costs.pricePerSquareMeter, 16065)
  })

  it('nao mistura anuncio de aluguel em busca de venda', () => {
    const html = `
      <article>
        <a href="https://www.zapimoveis.com.br/imovel/aluguel-apartamento-3-quartos-sagrada-familia-belo-horizonte-mg-98m2-id-2886787973/">
          Apartamento para aluguel com 3 quartos no Sagrada Familia.
          Aluguel R$ 3.600
          98 m2 - 3 quartos - 2 vagas
        </a>
      </article>
    `
    const listings = parseListingsFromHtml({
      html,
      source: 'ZAP Imoveis',
      transaction: 'sale',
      pageUrl: 'https://www.zapimoveis.com.br/venda/apartamentos/mg+belo-horizonte+sagrada-familia/',
      maxListings: 5,
    })

    assert.equal(listings.length, 0)
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
