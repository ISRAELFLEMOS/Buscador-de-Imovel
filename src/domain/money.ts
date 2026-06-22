export function parseBrazilianCurrency(value: string): number | undefined {
  const match = value.match(BRAZILIAN_CURRENCY_PATTERN)
  if (!match) {
    return undefined
  }

  return parseCurrencyToken(match[1])
}

export function parseAllBrazilianCurrencies(value: string): number[] {
  const matches = value.matchAll(BRAZILIAN_CURRENCY_GLOBAL_PATTERN)
  return Array.from(matches)
    .map((match) => parseCurrencyToken(match[1]))
    .filter((parsed): parsed is number => typeof parsed === 'number' && Number.isFinite(parsed))
}

const BRAZILIAN_CURRENCY_SOURCE = String.raw`R\$\s*((?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?)`
const BRAZILIAN_CURRENCY_PATTERN = new RegExp(BRAZILIAN_CURRENCY_SOURCE, 'i')
const BRAZILIAN_CURRENCY_GLOBAL_PATTERN = new RegExp(BRAZILIAN_CURRENCY_SOURCE, 'gi')

function parseCurrencyToken(token: string): number | undefined {
  const normalized = token.replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function formatCurrency(value?: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'Nao informado'
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCurrencyPrecise(value?: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'Nao informado'
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value)
}

export function sumKnown(values: Array<number | undefined>): number | undefined {
  const known = values.filter((value): value is number => typeof value === 'number')
  if (known.length === 0) {
    return undefined
  }

  return known.reduce((total, value) => total + value, 0)
}
