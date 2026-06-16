import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium, type Browser, type Page } from 'playwright'
import { DEFAULT_MAX_RENT_TOTAL, DEFAULT_RADIUS_KM, SEARCH_CENTER } from '../../src/domain/config'
import { sortByCostBenefit } from '../../src/domain/ranking'
import type { Listing, ListingsDataset, SourceRunReport } from '../../src/domain/types'
import { mergeListingWithDetailHtml, parseListingsFromHtml } from './parser'
import { checkRobots } from './robots'
import { SOURCE_CONFIGS } from './sourceConfig'

interface CliOptions {
  dryRun: boolean
  output: string
  maxListingsPerSearch: number
}

const options = parseArgs(process.argv.slice(2))
const reports: SourceRunReport[] = []
const listings: Listing[] = []
const DETAIL_ENRICHMENT_LIMIT = 60

await main()

async function main() {
  let browser: Browser | undefined
  let normalizedListings: Listing[]

  try {
    if (!options.dryRun) {
      browser = await chromium.launch({ headless: true })
    }

    for (const source of SOURCE_CONFIGS) {
      for (const search of source.searches) {
        const startedAt = new Date().toISOString()
        const robots = await checkRobots(source, search.url)

        if (!robots.allowed) {
          reports.push({
            source: source.source,
            status: 'blocked-by-robots',
            url: search.url,
            message: robots.message,
            collected: 0,
            startedAt,
            finishedAt: new Date().toISOString(),
          })
          continue
        }

        if (options.dryRun) {
          reports.push({
            source: source.source,
            status: 'ok',
            url: search.url,
            message: `${robots.message}. Dry-run nao abriu a pagina.`,
            collected: 0,
            startedAt,
            finishedAt: new Date().toISOString(),
          })
          continue
        }

        await sleep(robots.crawlDelayMs)
        const page = await browser!.newPage({
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari BuscadorDeImovelBH/1.0',
        })

        try {
          await page.goto(search.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
          await page.waitForTimeout(2500)
          const html = await page.content()
          const parsed = parseListingsFromHtml({
            source: source.source,
            transaction: search.transaction,
            pageUrl: search.url,
            html,
            maxListings: options.maxListingsPerSearch,
          })
          listings.push(...parsed)
          reports.push({
            source: source.source,
            status: 'ok',
            url: search.url,
            message: `${robots.message}. Pagina processada sem login, CAPTCHA ou bypass.`,
            collected: parsed.length,
            startedAt,
            finishedAt: new Date().toISOString(),
          })
        } catch (error) {
          reports.push({
            source: source.source,
            status: 'failed',
            url: search.url,
            message: error instanceof Error ? error.message : 'Erro desconhecido durante coleta.',
            collected: 0,
            startedAt,
            finishedAt: new Date().toISOString(),
          })
        } finally {
          await page.close()
        }
      }
    }

    normalizedListings = dedupeListings(listings)
    if (browser && !options.dryRun) {
      normalizedListings = await enrichListingsWithDetailPages(browser, normalizedListings)
    }
  } finally {
    await browser?.close()
  }

  const dataset: ListingsDataset = {
    generatedAt: new Date().toISOString(),
    center: SEARCH_CENTER,
    radiusKm: DEFAULT_RADIUS_KM,
    strictRadiusDefault: false,
    listings: sortByCostBenefit(applyRentalPolicy(normalizedListings)),
    reports,
    notices: [
      'Scraper conservador: respeita robots.txt, nao usa login, nao resolve CAPTCHA e nao burla bloqueios.',
      'Contato e numero do anuncio sao coletados somente quando ficam visiveis no HTML publico.',
      `Fase inicial focada em aluguel; anuncios acima de ${DEFAULT_MAX_RENT_TOTAL.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
      })} sao descartados por padrao.`,
    ],
  }

  if (options.dryRun) {
    console.log(JSON.stringify({ reports, plannedOutput: options.output }, null, 2))
    return
  }

  await mkdir(path.dirname(options.output), { recursive: true })
  await writeFile(options.output, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8')
  console.log(`Coleta concluida: ${dataset.listings.length} anuncios em ${options.output}`)
}

function parseArgs(args: string[]): CliOptions {
  const dryRun = args.includes('--dry-run')
  const outputIndex = args.indexOf('--output')
  const maxIndex = args.indexOf('--max-listings')

  return {
    dryRun,
    output:
      outputIndex >= 0 && args[outputIndex + 1]
        ? args[outputIndex + 1]
        : path.join(process.cwd(), 'public', 'data', 'listings.json'),
    maxListingsPerSearch:
      maxIndex >= 0 && args[maxIndex + 1] ? Number(args[maxIndex + 1]) : 24,
  }
}

function dedupeListings(items: Listing[]): Listing[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.url)) {
      return false
    }
    seen.add(item.url)
    return true
  })
}

function applyRentalPolicy(items: Listing[]): Listing[] {
  return items.filter((item) => {
    if (item.transaction !== 'rent') {
      return false
    }

    const rentTotal = item.costs.monthlyTotal ?? item.costs.rent
    return typeof rentTotal === 'number' && rentTotal <= DEFAULT_MAX_RENT_TOTAL
  })
}

async function enrichListingsWithDetailPages(browser: Browser, items: Listing[]): Promise<Listing[]> {
  const sourceConfig = SOURCE_CONFIGS.find((source) => source.source === 'QuintoAndar')
  if (!sourceConfig) {
    return items
  }

  const startedAt = new Date().toISOString()
  let enriched = 0
  let blocked = 0
  let failed = 0
  let skippedByPrice = 0

  const enrichedItems: Listing[] = []

  for (const item of items) {
    if (item.source !== 'QuintoAndar' || item.transaction !== 'rent' || enriched >= DETAIL_ENRICHMENT_LIMIT) {
      enrichedItems.push(item)
      continue
    }

    const rentTotal = item.costs.monthlyTotal ?? item.costs.rent
    if (typeof rentTotal === 'number' && rentTotal > DEFAULT_MAX_RENT_TOTAL) {
      skippedByPrice += 1
      enrichedItems.push(item)
      continue
    }

    const robots = await checkRobots(sourceConfig, item.url)
    if (!robots.allowed) {
      blocked += 1
      enrichedItems.push(item)
      continue
    }

    await sleep(robots.crawlDelayMs)
    const page = await browser.newPage({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari BuscadorDeImovelBH/1.0',
    })

    try {
      await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForTimeout(2500)
      const html = await collectDetailHtml(page)
      enrichedItems.push(mergeListingWithDetailHtml(item, html))
      enriched += 1
    } catch {
      failed += 1
      enrichedItems.push(item)
    } finally {
      await page.close()
    }
  }

  reports.push({
    source: 'QuintoAndar',
    status: failed > 0 && enriched === 0 ? 'failed' : 'ok',
    url: sourceConfig.baseUrl,
    message: `Detalhes consultados para custos completos: ${enriched}. Bloqueados por robots: ${blocked}. Ignorados por teto: ${skippedByPrice}. Falhas: ${failed}.`,
    collected: enriched,
    startedAt,
    finishedAt: new Date().toISOString(),
  })

  return enrichedItems
}

async function collectDetailHtml(page: Page): Promise<string> {
  for (const y of [0, 600, 1200, 1800]) {
    await page.evaluate((scrollY) => {
      ;(globalThis as unknown as { scrollTo: (x: number, y: number) => void }).scrollTo(0, scrollY)
    }, y)
    await page.waitForTimeout(600)
  }

  const html = await page.content()
  const bodyText = await page
    .locator('body')
    .innerText({ timeout: 10000 })
    .catch(() => '')

  return `${html}<pre data-collected-body-text="true">${escapeHtml(bodyText)}</pre>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
