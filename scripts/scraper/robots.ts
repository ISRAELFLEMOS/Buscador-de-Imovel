import robotsParser from 'robots-parser'
import type { SourceConfig } from './sourceConfig'

const USER_AGENT = 'BuscadorDeImovelBH/1.0'

export interface RobotsDecision {
  allowed: boolean
  crawlDelayMs: number
  message: string
}

export async function checkRobots(source: SourceConfig, targetUrl: string): Promise<RobotsDecision> {
  try {
    const response = await fetch(source.robotsUrl, {
      headers: {
        'user-agent': USER_AGENT,
      },
    })

    if (!response.ok) {
      return {
        allowed: false,
        crawlDelayMs: 0,
        message: `robots.txt retornou HTTP ${response.status}`,
      }
    }

    const text = await response.text()
    const robots = robotsParser(source.robotsUrl, text)
    const allowed = robots.isAllowed(targetUrl, USER_AGENT) !== false
    const crawlDelaySeconds = robots.getCrawlDelay(USER_AGENT) ?? robots.getCrawlDelay('*') ?? 2

    return {
      allowed,
      crawlDelayMs: Math.max(1200, crawlDelaySeconds * 1000),
      message: allowed ? 'Permitido por robots.txt' : 'Bloqueado por robots.txt',
    }
  } catch (error) {
    return {
      allowed: false,
      crawlDelayMs: 0,
      message: `Falha ao consultar robots.txt: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
    }
  }
}
