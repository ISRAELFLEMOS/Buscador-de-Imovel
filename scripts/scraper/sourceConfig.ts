import type { ListingSource, TransactionType } from '../../src/domain/types'

export interface SourceSearch {
  transaction: TransactionType
  url: string
}

export interface SourceConfig {
  source: ListingSource
  baseUrl: string
  robotsUrl: string
  searches: SourceSearch[]
}

const zapNeighborhoodSlugs = [
  'santa-teresa',
  'santa-efigenia',
  'floresta',
  'sagrada-familia',
  'savassi',
  'anchieta',
  'funcionarios',
  'sao-pedro',
] as const

function zapSearch(transaction: TransactionType, neighborhoodSlug?: string): SourceSearch {
  const operation = transaction === 'rent' ? 'aluguel' : 'venda'
  const location = neighborhoodSlug ? `mg+belo-horizonte+${neighborhoodSlug}` : 'mg+belo-horizonte'

  return {
    transaction,
    url: `https://www.zapimoveis.com.br/${operation}/apartamentos/${location}/`,
  }
}

export const SOURCE_CONFIGS: SourceConfig[] = [
  {
    source: 'ZAP Imoveis',
    baseUrl: 'https://www.zapimoveis.com.br',
    robotsUrl: 'https://www.zapimoveis.com.br/robots.txt',
    searches: [
      zapSearch('rent'),
      zapSearch('sale'),
      ...zapNeighborhoodSlugs.flatMap((slug) => [zapSearch('rent', slug), zapSearch('sale', slug)]),
    ],
  },
  {
    source: 'VivaReal',
    baseUrl: 'https://www.vivareal.com.br',
    robotsUrl: 'https://www.vivareal.com.br/robots.txt',
    searches: [
      {
        transaction: 'rent',
        url: 'https://www.vivareal.com.br/aluguel/minas-gerais/belo-horizonte/apartamento_residencial/',
      },
      {
        transaction: 'sale',
        url: 'https://www.vivareal.com.br/venda/minas-gerais/belo-horizonte/apartamento_residencial/',
      },
    ],
  },
  {
    source: 'OLX',
    baseUrl: 'https://www.olx.com.br',
    robotsUrl: 'https://www.olx.com.br/robots.txt',
    searches: [
      {
        transaction: 'rent',
        url: 'https://www.olx.com.br/imoveis/aluguel/apartamentos/estado-mg/belo-horizonte-e-regiao/belo-horizonte',
      },
      {
        transaction: 'sale',
        url: 'https://www.olx.com.br/imoveis/venda/apartamentos/estado-mg/belo-horizonte-e-regiao/belo-horizonte',
      },
    ],
  },
  {
    source: 'QuintoAndar',
    baseUrl: 'https://www.quintoandar.com.br',
    robotsUrl: 'https://www.quintoandar.com.br/robots.txt',
    searches: [
      {
        transaction: 'rent',
        url: 'https://www.quintoandar.com.br/alugar/imovel/belo-horizonte-mg-brasil/apartamento',
      },
      {
        transaction: 'sale',
        url: 'https://www.quintoandar.com.br/comprar/imovel/belo-horizonte-mg-brasil/apartamento',
      },
      {
        transaction: 'rent',
        url: 'https://www.quintoandar.com.br/alugar/imovel/santa-teresa-belo-horizonte-mg-brasil/apartamento',
      },
      {
        transaction: 'rent',
        url: 'https://www.quintoandar.com.br/alugar/imovel/santa-efigenia-belo-horizonte-mg-brasil/apartamento',
      },
      {
        transaction: 'rent',
        url: 'https://www.quintoandar.com.br/alugar/imovel/floresta-belo-horizonte-mg-brasil/apartamento',
      },
      {
        transaction: 'rent',
        url: 'https://www.quintoandar.com.br/alugar/imovel/sagrada-familia-belo-horizonte-mg-brasil/apartamento',
      },
      {
        transaction: 'rent',
        url: 'https://www.quintoandar.com.br/alugar/imovel/savassi-belo-horizonte-mg-brasil/apartamento',
      },
      {
        transaction: 'rent',
        url: 'https://www.quintoandar.com.br/alugar/imovel/anchieta-belo-horizonte-mg-brasil/apartamento',
      },
      {
        transaction: 'rent',
        url: 'https://www.quintoandar.com.br/alugar/imovel/funcionarios-belo-horizonte-mg-brasil/apartamento',
      },
      {
        transaction: 'rent',
        url: 'https://www.quintoandar.com.br/alugar/imovel/sao-pedro-belo-horizonte-mg-brasil/apartamento',
      },
    ],
  },
  {
    source: 'Imovelweb',
    baseUrl: 'https://www.imovelweb.com.br',
    robotsUrl: 'https://www.imovelweb.com.br/robots.txt',
    searches: [
      {
        transaction: 'rent',
        url: 'https://www.imovelweb.com.br/apartamentos-aluguel-belo-horizonte-mg.html',
      },
      {
        transaction: 'sale',
        url: 'https://www.imovelweb.com.br/apartamentos-venda-belo-horizonte-mg.html',
      },
    ],
  },
  {
    source: 'Lugar Certo',
    baseUrl: 'https://estadodeminas.lugarcerto.com.br',
    robotsUrl: 'https://estadodeminas.lugarcerto.com.br/robots.txt',
    searches: [
      {
        transaction: 'rent',
        url: 'https://estadodeminas.lugarcerto.com.br/busca/aluguel/mg/belo-horizonte/apartamento',
      },
      {
        transaction: 'sale',
        url: 'https://estadodeminas.lugarcerto.com.br/busca/venda/mg/belo-horizonte/apartamento',
      },
    ],
  },
  {
    source: 'Chaves na Mao',
    baseUrl: 'https://www.chavesnamao.com.br',
    robotsUrl: 'https://www.chavesnamao.com.br/robots.txt',
    searches: [
      {
        transaction: 'rent',
        url: 'https://www.chavesnamao.com.br/apartamentos-para-alugar/mg-belo-horizonte/',
      },
      {
        transaction: 'sale',
        url: 'https://www.chavesnamao.com.br/apartamentos-a-venda/mg-belo-horizonte/',
      },
    ],
  },
]
