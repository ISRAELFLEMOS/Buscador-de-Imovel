import { createHash } from 'node:crypto'
import * as cheerio from 'cheerio'
import type { AnyNode } from 'domhandler'
import { CENTRAL_BH_NEIGHBORHOODS } from '../../src/domain/config'
import { distanceFromCenter, inferCoordinatesFromNeighborhood, normalizeNeighborhood } from '../../src/domain/geo'
import { isLikelyPropertyImageUrl, uniqueImageUrls } from '../../src/domain/images'
import { parseAllBrazilianCurrencies, parseBrazilianCurrency, sumKnown } from '../../src/domain/money'
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
  images?: string[]
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

export function mergeListingWithDetailHtml(listing: Listing, detailHtml: string): Listing {
  const $ = cheerio.load(detailHtml)
  const detailText = normalizeText($('body').text())
  if (!detailText) {
    return listing
  }

  const detailCosts = inferCosts(detailText, listing.transaction)
  const costs = mergeCosts(listing.costs, detailCosts)
  const rawText = normalizeText([listing.rawText, detailText.slice(0, 2500)].filter(Boolean).join(' | '))
  const images = mergeImageUrls(listing.images, collectImageUrls($, listing.url))

  return {
    ...listing,
    address: inferAddress(detailText) ?? listing.address,
    bedrooms: listing.bedrooms ?? inferNumber(detailText, /(\d+)\s*(?:quarto|quartos|dorm|dormitorio|dormitÃ³rio)/i),
    bathrooms:
      listing.bathrooms ?? inferNumber(detailText, /(\d+)\s*(?:banheiro|banheiros|suite|suÃ­te|suites|suÃ­tes)/i),
    parkingSpaces: listing.parkingSpaces ?? inferNumber(detailText, /(\d+)\s*(?:vaga|vagas|garagem)/i),
    areaM2: listing.areaM2 ?? inferNumber(detailText, /(\d{2,4})\s*m(?:2|Â²)/i),
    costs,
    images,
    rawText,
    warnings: buildWarnings(costs, listing.sourceListingId, listing.distanceConfidence),
  }
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

    const images = collectElementImages($, anchor, pageUrl)

    seen.add(url)
    candidates.push({ url, text: text.slice(0, 1200), images })
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

  if (looksLikeCategoryPage(title, candidate.text) || looksLikeWrongTransaction(title, transaction)) {
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
    images: candidate.images ?? [],
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
  const explicitMonthlyTotal = transaction === 'rent' ? inferExplicitMonthlyTotal(text, rent) : undefined
  const componentLimit =
    typeof explicitMonthlyTotal === 'number' && typeof rent === 'number'
      ? Math.max(explicitMonthlyTotal - rent, 0)
      : undefined
  const condominium = inferCurrencyAfter(text, /condom[ií]nio|cond\./i, componentLimit)
  const iptu = inferCurrencyAfter(text, /iptu/i, componentLimit)
  const insurance = inferCurrencyAfter(text, /seguro/i, componentLimit)
  const other = inferCurrencyAfter(text, /taxa|outr[oa]s/i, componentLimit)
  const estimatedMonthlyTotal = transaction === 'rent' ? sumKnown([rent, condominium, iptu, insurance, other]) : undefined
  const monthlyTotal = explicitMonthlyTotal ?? estimatedMonthlyTotal
  const areaM2 = inferNumber(text, /(\d{2,4})\s*m(?:2|²)/i)

  return {
    rent,
    condominium,
    iptu,
    insurance,
    other,
    monthlyTotal,
    monthlyTotalConfidence:
      transaction === 'rent' ? (explicitMonthlyTotal ? 'confirmed' : monthlyTotal ? 'estimated' : 'missing') : 'missing',
    salePrice,
    pricePerSquareMeter: salePrice && areaM2 ? Math.round(salePrice / areaM2) : undefined,
  }
}

function inferExplicitMonthlyTotal(text: string, rent?: number): number | undefined {
  const candidates: number[] = []

  for (const match of text.matchAll(/\b(?:valor\s+total|total\s+(?:mensal|do\s+aluguel)|total)\b\s*[:#-]?\s*(R\$\s*[\d.,]+)/gi)) {
    const value = parseBrazilianCurrency(match[1])
    if (isPlausibleMonthlyTotal(value, rent)) {
      candidates.push(value)
    }
  }

  for (const match of text.matchAll(/(R\$\s*[\d.,]+)\s*(?:total|valor\s+total)/gi)) {
    const value = parseBrazilianCurrency(match[1])
    if (isPlausibleMonthlyTotal(value, rent)) {
      candidates.push(value)
    }
  }

  const value = inferCurrencyAfter(text, /total\s+(?:mensal|do\s+aluguel)|valor\s+total/i)
  if (isPlausibleMonthlyTotal(value, rent)) {
    candidates.push(value)
  }

  if (candidates.length === 0) {
    return undefined
  }

  if (typeof rent === 'number') {
    const firstAboveRent = candidates.find((candidate) => candidate > rent + 1)
    if (firstAboveRent) {
      return firstAboveRent
    }
  }

  return candidates[0]
}

function isPlausibleMonthlyTotal(value: number | undefined, rent?: number): value is number {
  if (typeof value !== 'number') {
    return false
  }

  if (typeof rent === 'number' && value + 1 < rent) {
    return false
  }

  return value > 0 && value <= 50000
}

function mergeCosts(summary: ListingCosts, detail: ListingCosts): ListingCosts {
  return {
    rent: detail.rent ?? summary.rent,
    condominium: detail.condominium ?? summary.condominium,
    iptu: detail.iptu ?? summary.iptu,
    insurance: detail.insurance ?? summary.insurance,
    other: detail.other ?? summary.other,
    monthlyTotal: detail.monthlyTotal ?? summary.monthlyTotal,
    monthlyTotalConfidence: strongestConfidence(summary.monthlyTotalConfidence, detail.monthlyTotalConfidence),
    salePrice: detail.salePrice ?? summary.salePrice,
    pricePerSquareMeter: detail.pricePerSquareMeter ?? summary.pricePerSquareMeter,
  }
}

function strongestConfidence(left: ListingCosts['monthlyTotalConfidence'], right: ListingCosts['monthlyTotalConfidence']) {
  const weights: Record<ListingCosts['monthlyTotalConfidence'], number> = {
    missing: 0,
    estimated: 1,
    confirmed: 2,
  }

  return weights[right] > weights[left] ? right : left
}

function inferCurrencyAfter(text: string, label: RegExp, maxValue?: number): number | undefined {
  const flags = label.flags.includes('g') ? label.flags : `${label.flags}g`
  const pattern = new RegExp(label.source, flags)

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? -1
    if (index < 0) {
      continue
    }

    const value = parseAllBrazilianCurrencies(text.slice(index, index + 160))[0]
    if (typeof value === 'number' && (typeof maxValue !== 'number' || value <= maxValue)) {
      return value
    }
  }

  return undefined
}

function inferTitle(text: string): string | undefined {
  const sentence = text
    .split(/(?=R\$)|\n| {2,}/)
    .map((part) => part.trim())
    .find((part) => part.length >= 12 && /apartamento|cobertura|flat|studio|im[oó]vel/i.test(part))

  return sentence?.slice(0, 140)
}

function inferNeighborhood(text: string): string | undefined {
  const normalizedText = normalizeNeighborhood(text)
  if (/\bsanta tereza\b/i.test(normalizedText)) {
    return 'Santa Teresa'
  }

  return CENTRAL_BH_NEIGHBORHOODS.find((neighborhood) =>
    new RegExp(`\\b${escapeRegex(normalizeNeighborhood(neighborhood))}\\b`, 'i').test(normalizedText),
  )
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

function looksLikeCategoryPage(title: string, text: string): boolean {
  return (
    /apartamentos?\s+at[eé]\s+[\d.]+/i.test(title) ||
    /aluguel\s+de\s+apartamento\s+at[eé]/i.test(title) ||
    /mais\s+de\s+\d+\s+apartamentos/i.test(text)
  )
}

function looksLikeWrongTransaction(title: string, transaction: TransactionType): boolean {
  if (transaction === 'rent') {
    return /\b(?:a venda|venda|comprar|à venda)\b/i.test(title) && !/\balugar|aluguel|loca[cç][aã]o\b/i.test(title)
  }

  return /\b(?:alugar|aluguel|loca[cç][aã]o)\b/i.test(title) && !/\b(?:a venda|venda|comprar|à venda)\b/i.test(title)
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

function collectElementImages(
  $: cheerio.CheerioAPI,
  element: cheerio.Cheerio<AnyNode>,
  baseUrl: string,
): string[] {
  const container = element.closest('article, li, section, div')
  return collectImageUrls($, baseUrl, element.add(container))
}

function collectImageUrls(
  $: cheerio.CheerioAPI,
  baseUrl: string,
  root: cheerio.Cheerio<AnyNode> = $('body'),
): string[] {
  const urls: string[] = []

  root.find('img, source').each((_, image) => {
    const node = $(image)
    for (const attribute of ['src', 'data-src', 'data-original', 'data-lazy-src', 'srcset', 'data-srcset']) {
      const rawValue = node.attr(attribute)
      for (const candidate of imageCandidatesFromAttribute(rawValue)) {
        const url = normalizeUrl(candidate, baseUrl)
        if (url && looksLikeImageUrl(url)) {
          urls.push(url)
        }
      }
    }
  })

  return mergeImageUrls(urls).slice(0, 8)
}

function imageCandidatesFromAttribute(value: string | undefined): string[] {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean)
}

function looksLikeImageUrl(url: string): boolean {
  return isLikelyPropertyImageUrl(url)
}

function mergeImageUrls(...groups: Array<string[] | undefined>): string[] {
  return uniqueImageUrls(groups.flatMap((group) => group ?? []))
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
