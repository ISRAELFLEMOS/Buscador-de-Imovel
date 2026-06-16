export function parseBrazilianCurrency(value: string): number | undefined {
  const match = value.match(/R\$\s*([\d.,]+)/i)
  if (!match) {
    return undefined
  }

  const normalized = match[1].replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function parseAllBrazilianCurrencies(value: string): number[] {
  const matches = value.matchAll(/R\$\s*([\d.,]+)/gi)
  return Array.from(matches)
    .map((match) => Number(match[1].replace(/\./g, '').replace(',', '.')))
    .filter((parsed) => Number.isFinite(parsed))
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
