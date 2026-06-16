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

export const SOURCE_CONFIGS: SourceConfig[] = [
  {
    source: 'ZAP Imoveis',
    baseUrl: 'https://www.zapimoveis.com.br',
    robotsUrl: 'https://www.zapimoveis.com.br/robots.txt',
    searches: [
      {
        transaction: 'sale',
        url: 'https://www.zapimoveis.com.br/venda/apartamentos/mg+belo-horizonte/',
      },
      {
        transaction: 'rent',
        url: 'https://www.zapimoveis.com.br/aluguel/apartamentos/mg+belo-horizonte/',
      },
    ],
  },
  {
    source: 'VivaReal',
    baseUrl: 'https://www.vivareal.com.br',
    robotsUrl: 'https://www.vivareal.com.br/robots.txt',
    searches: [
      {
        transaction: 'sale',
        url: 'https://www.vivareal.com.br/venda/minas-gerais/belo-horizonte/apartamento_residencial/',
      },
      {
        transaction: 'rent',
        url: 'https://www.vivareal.com.br/aluguel/minas-gerais/belo-horizonte/apartamento_residencial/',
      },
    ],
  },
  {
    source: 'OLX',
    baseUrl: 'https://www.olx.com.br',
    robotsUrl: 'https://www.olx.com.br/robots.txt',
    searches: [
      {
        transaction: 'sale',
        url: 'https://www.olx.com.br/imoveis/venda/apartamentos/estado-mg/belo-horizonte-e-regiao/belo-horizonte',
      },
      {
        transaction: 'rent',
        url: 'https://www.olx.com.br/imoveis/aluguel/apartamentos/estado-mg/belo-horizonte-e-regiao/belo-horizonte',
      },
    ],
  },
  {
    source: 'QuintoAndar',
    baseUrl: 'https://www.quintoandar.com.br',
    robotsUrl: 'https://www.quintoandar.com.br/robots.txt',
    searches: [
      {
        transaction: 'sale',
        url: 'https://www.quintoandar.com.br/comprar/imovel/belo-horizonte-mg-brasil/apartamento',
      },
      {
        transaction: 'rent',
        url: 'https://www.quintoandar.com.br/alugar/imovel/belo-horizonte-mg-brasil/apartamento',
      },
    ],
  },
  {
    source: 'Imovelweb',
    baseUrl: 'https://www.imovelweb.com.br',
    robotsUrl: 'https://www.imovelweb.com.br/robots.txt',
    searches: [
      {
        transaction: 'sale',
        url: 'https://www.imovelweb.com.br/apartamentos-venda-belo-horizonte-mg.html',
      },
      {
        transaction: 'rent',
        url: 'https://www.imovelweb.com.br/apartamentos-aluguel-belo-horizonte-mg.html',
      },
    ],
  },
  {
    source: 'Lugar Certo',
    baseUrl: 'https://estadodeminas.lugarcerto.com.br',
    robotsUrl: 'https://estadodeminas.lugarcerto.com.br/robots.txt',
    searches: [
      {
        transaction: 'sale',
        url: 'https://estadodeminas.lugarcerto.com.br/busca/venda/mg/belo-horizonte/apartamento',
      },
      {
        transaction: 'rent',
        url: 'https://estadodeminas.lugarcerto.com.br/busca/aluguel/mg/belo-horizonte/apartamento',
      },
    ],
  },
  {
    source: 'Chaves na Mao',
    baseUrl: 'https://www.chavesnamao.com.br',
    robotsUrl: 'https://www.chavesnamao.com.br/robots.txt',
    searches: [
      {
        transaction: 'sale',
        url: 'https://www.chavesnamao.com.br/apartamentos-a-venda/mg-belo-horizonte/',
      },
      {
        transaction: 'rent',
        url: 'https://www.chavesnamao.com.br/apartamentos-para-alugar/mg-belo-horizonte/',
      },
    ],
  },
]
