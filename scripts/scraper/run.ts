import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium, type Browser } from 'playwright'
import { DEFAULT_RADIUS_KM, SEARCH_CENTER } from '../../src/domain/config'
import { sortByCostBenefit } from '../../src/domain/ranking'
import type { Listing, ListingsDataset, SourceRunReport } from '../../src/domain/types'
import { parseListingsFromHtml } from './parser'
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

await main()

async function main() {
  let browser: Browser | undefined

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
  } finally {
    await browser?.close()
  }

  const dataset: ListingsDataset = {
    generatedAt: new Date().toISOString(),
    center: SEARCH_CENTER,
    radiusKm: DEFAULT_RADIUS_KM,
    strictRadiusDefault: true,
    listings: sortByCostBenefit(dedupeListings(listings)),
    reports,
    notices: [
      'Scraper conservador: respeita robots.txt, nao usa login, nao resolve CAPTCHA e nao burla bloqueios.',
      'Contato e numero do anuncio sao coletados somente quando ficam visiveis no HTML publico.',
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
      maxIndex >= 0 && args[maxIndex + 1] ? Number(args[maxIndex + 1]) : 12,
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
