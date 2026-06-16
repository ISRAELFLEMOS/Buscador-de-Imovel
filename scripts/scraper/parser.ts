import { createHash } from 'node:crypto'
import * as cheerio from 'cheerio'
import { CENTRAL_BH_NEIGHBORHOODS } from '../../src/domain/config'
import { distanceFromCenter, inferCoordinatesFromNeighborhood } from '../../src/domain/geo'
import { parseAllBrazilianCurrencies, sumKnown } from '../../src/domain/money'
import type { Listing, ListingCosts, ListingSource, TransactionType } from '../../src/domain/types'

interface ParseOptions {
  source: ListingSource
  transaction: TransactionType
  pageUrl: string
  html: string
  maxListings: number
}

interface AnchorCandidate {
  url: string
  text: string
  image?: string
}

export function parseListingsFromHtml(options: ParseOptions): Listing[] {
  const $ = cheerio.load(options.html)
  const candidates = collectCandidates($, options.pageUrl, options.maxListings * 5)
  const collectedAt = new Date().toISOString()
  const seen = new Set<string>()
  const listings: Listing[] = []

  for (const candidate of candidates) {
    if (seen.has(candidate.url) || listings.length >= options.maxListings) {
      continue
    }
    seen.add(candidate.url)

    const listing = parseCandidate({
      candidate,
      collectedAt,
      source: options.source,
      transaction: options.transaction,
    })

    if (listing) {
      listings.push(listing)
    }
  }

  return listings
}

export function parseCandidateForTest(
  candidate: AnchorCandidate,
  source: ListingSource,
  transaction: TransactionType,
): Listing | undefined {
  return parseCandidate({
    candidate,
    collectedAt: '2026-06-15T00:00:00.000Z',
    source,
    transaction,
  })
}

function collectCandidates(
  $: cheerio.CheerioAPI,
  pageUrl: string,
  limit: number,
): AnchorCandidate[] {
  const candidates: AnchorCandidate[] = []
  const seen = new Set<string>()

  $('a[href]').each((_, element) => {
    if (candidates.length >= limit) {
      return false
    }

    const anchor = $(element)
    const href = anchor.attr('href')
    const url = normalizeUrl(href, pageUrl)
    if (!url || seen.has(url) || !looksLikeListingUrl(url)) {
      return
    }

    const container = anchor.closest('article, li, section, div')
    const text = normalizeText(`${anchor.text()} ${container.text()}`)
    if (!looksLikeListingText(text)) {
      return
    }

    const image =
      normalizeUrl(anchor.find('img').first().attr('src') ?? container.find('img').first().attr('src'), pageUrl) ??
      undefined

    seen.add(url)
    candidates.push({ url, text: text.slice(0, 1200), image })
  })

  return candidates
}

function parseCandidate({
  candidate,
  collectedAt,
  source,
  transaction,
}: {
  candidate: AnchorCandidate
  collectedAt: string
  source: ListingSource
  transaction: TransactionType
}): Listing | undefined {
  const title = inferTitle(candidate.text)
  if (!title) {
    return undefined
  }

  const neighborhood = inferNeighborhood(candidate.text)
  const inferred = inferCoordinatesFromNeighborhood(neighborhood)
  const distanceKm = distanceFromCenter(inferred.coordinates)
  const costs = inferCosts(candidate.text, transaction)
  if ((transaction === 'rent' && !costs.rent) || (transaction === 'sale' && !costs.salePrice)) {
    return undefined
  }

  const areaM2 = inferNumber(candidate.text, /(\d{2,4})\s*m(?:2|²)/i)
  const parkingSpaces = inferNumber(candidate.text, /(\d+)\s*(?:vaga|vagas|garagem)/i)
  const sourceListingId = inferListingId(candidate.url, candidate.text, costs)
  const isNewOrRenovated = /(novo|novinho|reformad[ao]|recem reformad[ao]|recém reformad[ao]|lancamento|lançamento)/i.test(
    candidate.text,
  )

  return {
    id: stableId(`${source}:${candidate.url}`),
    source,
    sourceListingId,
    url: candidate.url,
    title,
    transaction,
    neighborhood,
    address: inferAddress(candidate.text),
    coordinates: inferred.coordinates,
    distanceKm,
    distanceConfidence: inferred.confidence,
    bedrooms: inferNumber(candidate.text, /(\d+)\s*(?:quarto|quartos|dorm|dormitorio|dormitório)/i),
    bathrooms: inferNumber(candidate.text, /(\d+)\s*(?:banheiro|banheiros|suite|suíte|suites|suítes)/i),
    parkingSpaces,
    areaM2,
    isNewOrRenovated,
    newOrRenovatedEvidence: isNewOrRenovated ? inferRenovationEvidence(candidate.text) : undefined,
    contactName: inferContact(candidate.text),
    images: candidate.image ? [candidate.image] : [],
    costs,
    collectedAt,
    rawText: candidate.text,
    warnings: buildWarnings(costs, sourceListingId, inferred.confidence),
  }
}

function inferCosts(text: string, transaction: TransactionType): ListingCosts {
  const values = parseAllBrazilianCurrencies(text)
  const rent = transaction === 'rent' ? values[0] : undefined
  const salePrice = transaction === 'sale' ? values[0] : undefined
  const condominium = inferCurrencyAfter(text, /condom[ií]nio|cond\./i)
  const iptu = inferCurrencyAfter(text, /iptu/i)
  const insurance = inferCurrencyAfter(text, /seguro/i)
  const other = inferCurrencyAfter(text, /taxa|outr[oa]s/i)
  const monthlyTotal = transaction === 'rent' ? sumKnown([rent, condominium, iptu, insurance, other]) : undefined
  const areaM2 = inferNumber(text, /(\d{2,4})\s*m(?:2|²)/i)

  return {
    rent,
    condominium,
    iptu,
    insurance,
    other,
    monthlyTotal,
    monthlyTotalConfidence: transaction === 'rent' ? (monthlyTotal ? 'estimated' : 'missing') : 'missing',
    salePrice,
    pricePerSquareMeter: salePrice && areaM2 ? Math.round(salePrice / areaM2) : undefined,
  }
}

function inferCurrencyAfter(text: string, label: RegExp): number | undefined {
  const index = text.search(label)
  if (index < 0) {
    return undefined
  }
  const slice = text.slice(index, index + 120)
  return parseAllBrazilianCurrencies(slice)[0]
}

function inferTitle(text: string): string | undefined {
  const sentence = text
    .split(/(?=R\$)|\n| {2,}/)
    .map((part) => part.trim())
    .find((part) => part.length >= 12 && /apartamento|cobertura|flat|studio|im[oó]vel/i.test(part))

  return sentence?.slice(0, 140)
}

function inferNeighborhood(text: string): string | undefined {
  return CENTRAL_BH_NEIGHBORHOODS.find((neighborhood) => new RegExp(`\\b${escapeRegex(neighborhood)}\\b`, 'i').test(text))
}

function inferAddress(text: string): string | undefined {
  const match = text.match(/\b(?:Rua|R\.|Avenida|Av\.|Alameda|Pra[cç]a)\s+[^,.;]{3,80}/i)
  return match?.[0]?.trim()
}

function inferContact(text: string): string | undefined {
  const match = text.match(/(?:imobili[aá]ria|corretor[ae]?|anunciante)\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wÀ-ÿ ]{2,50})/i)
  return match?.[1]?.trim()
}

function inferRenovationEvidence(text: string): string | undefined {
  const match = text.match(/(?:novo|novinho|reformad[ao]|recem reformad[ao]|recém reformad[ao]|lancamento|lançamento).{0,50}/i)
  return match?.[0]?.trim()
}

function inferListingId(url: string, text: string, costs: ListingCosts): string | undefined {
  const explicit = text.match(/\b(?:cod\.?|c[oó]digo|referencia|referência|id)\b\s*[:#-]?\s*([A-Z0-9-]{4,})/i)
  if (explicit?.[1]) {
    return explicit[1]
  }

  const inferred = url.match(/(\d{5,})(?:[/?#-]|$)/)?.[1]
  if (!inferred) {
    return undefined
  }

  const numericId = Number(inferred)
  if (numericId === costs.salePrice || numericId === costs.rent) {
    return undefined
  }

  return inferred
}

function inferNumber(text: string, pattern: RegExp): number | undefined {
  const value = Number(text.match(pattern)?.[1])
  return Number.isFinite(value) ? value : undefined
}

function buildWarnings(
  costs: ListingCosts,
  sourceListingId: string | undefined,
  distanceConfidence: string,
): string[] {
  const warnings: string[] = []

  if (!sourceListingId) warnings.push('Numero do anuncio nao ficou visivel no resumo.')
  if (distanceConfidence !== 'confirmed') warnings.push('Distancia estimada por bairro ou ausente.')
  if (!costs.salePrice && !costs.monthlyTotal) warnings.push('Preco principal nao identificado.')
  if (costs.monthlyTotalConfidence === 'estimated') warnings.push('Total mensal somado a partir dos custos visiveis.')

  return warnings
}

function looksLikeListingUrl(url: string): boolean {
  return /imovel|apartamento|apartamentos|comprar|alugar|venda|aluguel|classificado|anuncio/i.test(url)
}

function looksLikeListingText(text: string): boolean {
  if (/window\.dados|function\s*\(|script|googletag|dataLayer/i.test(text)) {
    return false
  }

  return /R\$/.test(text) && /apartamento|quarto|vaga|m²|m2|aluguel|venda/i.test(text)
}

function normalizeUrl(value: string | undefined, baseUrl: string): string | undefined {
  if (!value || value.startsWith('javascript:') || value.startsWith('#')) {
    return undefined
  }

  try {
    return new URL(value, baseUrl).toString()
  } catch {
    return undefined
  }
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function stableId(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16)
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
