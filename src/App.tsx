import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  BadgeCheck,
  Building2,
  Car,
  CircleDollarSign,
  ExternalLink,
  Filter,
  Home,
  ListFilter,
  MapPinned,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
} from 'lucide-react'
import './App.css'
import { FinancingPanel } from './components/FinancingPanel'
import { ListingTable } from './components/ListingTable'
import { MapPanel } from './components/MapPanel'
import { DEFAULT_FILTERS, filterListings, uniqueNeighborhoods, uniqueSources, type ListingSortMode } from './domain/filters'
import type { ListingFilters } from './domain/filters'
import { DEFAULT_MAX_RENT_TOTAL, DEFAULT_RADIUS_KM, SEARCH_CENTER } from './domain/config'
import { formatCurrency } from './domain/money'
import { neighborhoodPreferenceLabel } from './domain/neighborhoods'
import { sortByCostBenefit } from './domain/ranking'
import type { Listing, ListingsDataset } from './domain/types'
import { emptyDataset } from './data/emptyDataset'

const operationOptions: Array<{ label: string; value: ListingFilters['transaction'] }> = [
  { label: 'Aluguel', value: 'rent' },
  { label: 'Todos', value: 'all' },
  { label: 'Compra', value: 'sale' },
]

const sortOptions: Array<{ label: string; value: ListingSortMode }> = [
  { label: 'Melhor encaixe', value: 'best' },
  { label: 'Menor preco', value: 'price-asc' },
  { label: 'Menor distancia', value: 'distance-asc' },
  { label: 'Maior area', value: 'area-desc' },
  { label: 'Mais recente', value: 'newest' },
]

function App() {
  const [dataset, setDataset] = useState<ListingsDataset>(emptyDataset)
  const [filters, setFilters] = useState<ListingFilters>(DEFAULT_FILTERS)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'fallback'>('loading')

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/listings.json`, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        return response.json() as Promise<ListingsDataset>
      })
      .then((nextDataset) => {
        setDataset(nextDataset)
        setLoadState('ready')
      })
      .catch(() => {
        setDataset(emptyDataset)
        setLoadState('fallback')
      })
  }, [])

  const neighborhoods = useMemo(() => uniqueNeighborhoods(dataset.listings), [dataset.listings])
  const sources = useMemo(() => uniqueSources(dataset.listings), [dataset.listings])
  const filteredListings = useMemo(() => filterListings(dataset.listings, filters), [dataset.listings, filters])
  const visibleListings = useMemo(() => sortListings(filteredListings, filters.sortBy), [filteredListings, filters.sortBy])
  const rentListings = visibleListings.filter((listing) => listing.transaction === 'rent')
  const saleListings = visibleListings.filter((listing) => listing.transaction === 'sale')
  const confirmedInsideRadius = visibleListings.filter(
    (listing) => typeof listing.distanceKm === 'number' && listing.distanceKm <= DEFAULT_RADIUS_KM,
  ).length
  const activeFilterCount = countActiveFilters(filters)

  return (
    <main className="app-shell">
      <section className="toolbar" aria-label="Painel principal">
        <div className="toolbar-copy">
          <p className="eyebrow">Buscador de Imovel BH</p>
          <h1>Imoveis perto da Avenida Brasil, 1666</h1>
          <p className="subtitle">
            Busca operacional para comparar aluguel e compra por custo total, bairro, garagem,
            distancia, fonte e qualidade das informacoes.
          </p>
        </div>
        <div className="toolbar-actions">
          <a className="icon-link" href="https://github.com/israelflemos/Buscador-de-Imovel" target="_blank" rel="noreferrer">
            <ExternalLink size={18} aria-hidden="true" />
            GitHub
          </a>
          <span className="status-pill">
            <RefreshCw size={16} aria-hidden="true" />
            {loadState === 'loading' ? 'Carregando coleta' : `Atualizado ${formatDate(dataset.generatedAt)}`}
          </span>
        </div>
      </section>

      <section className="summary-grid" aria-label="Resumo da busca">
        <Metric icon={<Home />} label="Resultados" value={String(visibleListings.length)} />
        <Metric icon={<CircleDollarSign />} label="Alugueis" value={String(rentListings.length)} />
        <Metric icon={<Building2 />} label="Compras" value={String(saleListings.length)} />
        <Metric icon={<MapPinned />} label="No raio" value={String(confirmedInsideRadius)} />
      </section>

      <section className="workspace-grid">
        <aside className="filter-panel" aria-label="Filtros">
          <div className="panel-heading">
            <div className="section-title">
              <Filter size={18} aria-hidden="true" />
              <h2>Filtros</h2>
            </div>
            <button className="ghost-button" type="button" onClick={() => setFilters(DEFAULT_FILTERS)}>
              <RotateCcw size={16} aria-hidden="true" />
              Limpar
            </button>
          </div>

          <label>
            Busca livre
            <div className="search-input">
              <Search size={16} aria-hidden="true" />
              <input
                value={filters.query}
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                placeholder="bairro, rua, portal, codigo"
              />
            </div>
          </label>

          <div className="field-group">
            <span className="field-label">Operacao</span>
            <div className="segmented-control" role="group" aria-label="Operacao">
              {operationOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={filters.transaction === option.value ? 'active' : undefined}
                  aria-pressed={filters.transaction === option.value}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      transaction: option.value,
                    }))
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="input-grid">
            {filters.transaction !== 'sale' ? (
              <label>
                Aluguel maximo
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={filters.maxRentTotal}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      maxRentTotal: Number(event.target.value),
                    }))
                  }
                />
              </label>
            ) : null}

            {filters.transaction !== 'rent' ? (
              <label>
                Compra maxima
                <input
                  type="number"
                  min={0}
                  step={50000}
                  value={filters.maxSalePrice}
                  placeholder="Sem limite"
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      maxSalePrice: Number(event.target.value),
                    }))
                  }
                />
              </label>
            ) : null}

            <label>
              Quartos min.
              <input
                type="number"
                min={0}
                max={5}
                value={filters.minBedrooms}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    minBedrooms: Number(event.target.value),
                  }))
                }
              />
            </label>

            <label>
              Area min.
              <input
                type="number"
                min={0}
                step={10}
                value={filters.minAreaM2}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    minAreaM2: Number(event.target.value),
                  }))
                }
              />
            </label>

            <label>
              Vagas min.
              <input
                type="number"
                min={0}
                max={4}
                value={filters.minParkingSpaces}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    minParkingSpaces: Number(event.target.value),
                  }))
                }
              />
            </label>
          </div>

          <div className="checkbox-stack">
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={filters.strictRadius}
                onChange={(event) => setFilters((current) => ({ ...current, strictRadius: event.target.checked }))}
              />
              Restringir ao raio de {DEFAULT_RADIUS_KM} km
            </label>

            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={filters.onlyTwoPlusParking}
                onChange={(event) => setFilters((current) => ({ ...current, onlyTwoPlusParking: event.target.checked }))}
              />
              Somente 2+ vagas
            </label>

            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={filters.onlyNewOrRenovated}
                onChange={(event) => setFilters((current) => ({ ...current, onlyNewOrRenovated: event.target.checked }))}
              />
              Novo ou reformado
            </label>

            {filters.transaction !== 'sale' ? (
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={filters.onlyKnownTotal}
                  onChange={(event) => setFilters((current) => ({ ...current, onlyKnownTotal: event.target.checked }))}
                />
                Total confirmado pelo portal
              </label>
            ) : null}
          </div>

          <FilterChecklist
            title="Fontes"
            items={sources}
            selected={filters.sources}
            onChange={(source, checked) =>
              setFilters((current) => ({
                ...current,
                sources: checked
                  ? [...current.sources, source]
                  : current.sources.filter((item) => item !== source),
              }))
            }
          />

          <div className="neighborhood-list">
            <span>Bairros preferidos da Layza</span>
            {neighborhoods.length === 0 ? (
              <p className="muted">Os bairros aparecem depois da coleta.</p>
            ) : (
              neighborhoods.map((neighborhood) => {
                const preferenceLabel = neighborhoodPreferenceLabel(neighborhood)
                return (
                  <label className="checkbox-line" key={neighborhood}>
                    <input
                      type="checkbox"
                      checked={filters.neighborhoods.includes(neighborhood)}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          neighborhoods: event.target.checked
                            ? [...current.neighborhoods, neighborhood]
                            : current.neighborhoods.filter((item) => item !== neighborhood),
                        }))
                      }
                    />
                    <span>
                      {neighborhood}
                      {preferenceLabel ? <small> {preferenceLabel}</small> : null}
                    </span>
                  </label>
                )
              })
            )}
          </div>
        </aside>

        <section className="results-panel">
          {loadState === 'fallback' ? (
            <div className="notice">
              <ShieldAlert size={18} aria-hidden="true" />
              <span>Arquivo de coleta ainda nao publicado. Execute o scraper ou aguarde o workflow.</span>
            </div>
          ) : null}

          <div className="results-toolbar">
            <div>
              <p className="eyebrow">Resultados</p>
              <h2>{visibleListings.length} imoveis encontrados</h2>
              <p className="muted">{activeFilterCount} filtros ativos</p>
            </div>
            <label>
              Ordenar
              <select
                value={filters.sortBy}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    sortBy: event.target.value as ListingSortMode,
                  }))
                }
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="quick-filter-row" aria-label="Atalhos rapidos">
            <QuickFilter
              active={filters.onlyTwoPlusParking}
              icon={<Car size={15} aria-hidden="true" />}
              label="2+ vagas"
              onClick={() => setFilters((current) => ({ ...current, onlyTwoPlusParking: !current.onlyTwoPlusParking }))}
            />
            <QuickFilter
              active={filters.strictRadius}
              icon={<MapPinned size={15} aria-hidden="true" />}
              label={`Ate ${DEFAULT_RADIUS_KM} km`}
              onClick={() => setFilters((current) => ({ ...current, strictRadius: !current.strictRadius }))}
            />
            <QuickFilter
              active={filters.onlyNewOrRenovated}
              icon={<Home size={15} aria-hidden="true" />}
              label="Novo/reformado"
              onClick={() => setFilters((current) => ({ ...current, onlyNewOrRenovated: !current.onlyNewOrRenovated }))}
            />
            {filters.transaction !== 'sale' ? (
              <QuickFilter
                active={filters.onlyKnownTotal}
                icon={<BadgeCheck size={15} aria-hidden="true" />}
                label="Total confirmado"
                onClick={() => setFilters((current) => ({ ...current, onlyKnownTotal: !current.onlyKnownTotal }))}
              />
            ) : null}
          </div>

          <MapPanel listings={visibleListings} center={SEARCH_CENTER} />

          {filters.transaction !== 'sale' ? (
            <ListingTable title={`Alugueis ate ${formatCurrency(filters.maxRentTotal)}`} listings={rentListings} />
          ) : null}

          {filters.transaction !== 'rent' ? <ListingTable title="Compra" listings={saleListings} /> : null}

          <details className="reports" aria-label="Relatorio das fontes">
            <summary>
              <span>
                <ListFilter size={18} aria-hidden="true" />
                Fontes e bloqueios
              </span>
              <small>{dataset.reports.length} registros</small>
            </summary>
            <div className="report-grid">
              {dataset.reports.length === 0 ? (
                <p className="muted">Nenhum relatorio de scraping carregado.</p>
              ) : (
                dataset.reports.map((report) => (
                  <article className="report-row" key={`${report.source}-${report.url}`}>
                    <strong>{report.source}</strong>
                    <span>{report.status}</span>
                    <small>{report.message}</small>
                  </article>
                ))
              )}
            </div>
          </details>
        </section>
      </section>

      <details className="simulator-section" aria-label="Simulador de financiamento">
        <summary>Simulador de financiamento para compra</summary>
        <h2>Simulador de financiamento</h2>
        <FinancingPanel suggestedPrice={saleListings[0]?.costs.salePrice} />
      </details>
    </main>
  )
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <article className="metric">
      <span className="metric-icon">{icon}</span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  )
}

function QuickFilter({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button type="button" className={active ? 'quick-filter active' : 'quick-filter'} aria-pressed={active} onClick={onClick}>
      {icon}
      {label}
    </button>
  )
}

function FilterChecklist<T extends string>({
  title,
  items,
  selected,
  onChange,
}: {
  title: string
  items: T[]
  selected: T[]
  onChange: (item: T, checked: boolean) => void
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="checklist">
      <span>{title}</span>
      {items.map((item) => (
        <label className="checkbox-line" key={item}>
          <input type="checkbox" checked={selected.includes(item)} onChange={(event) => onChange(item, event.target.checked)} />
          <span>{item}</span>
        </label>
      ))}
    </div>
  )
}

function sortListings(listings: Listing[], sortBy: ListingSortMode): Listing[] {
  const sorted = sortByCostBenefit(listings)

  if (sortBy === 'best') {
    return sorted
  }

  return [...sorted].sort((a, b) => {
    if (sortBy === 'price-asc') {
      return comparablePrice(a) - comparablePrice(b)
    }

    if (sortBy === 'distance-asc') {
      return (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY)
    }

    if (sortBy === 'area-desc') {
      return (b.areaM2 ?? 0) - (a.areaM2 ?? 0)
    }

    return new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime()
  })
}

function comparablePrice(listing: Listing): number {
  const value =
    listing.transaction === 'rent'
      ? listing.costs.monthlyTotal ?? listing.costs.rent
      : listing.costs.salePrice

  return typeof value === 'number' ? value : Number.POSITIVE_INFINITY
}

function countActiveFilters(filters: ListingFilters): number {
  return [
    filters.transaction !== DEFAULT_FILTERS.transaction,
    filters.query.trim().length > 0,
    filters.maxRentTotal !== DEFAULT_MAX_RENT_TOTAL,
    filters.maxSalePrice > 0,
    filters.minBedrooms > 0,
    filters.minAreaM2 > 0,
    filters.minParkingSpaces > 0,
    filters.onlyTwoPlusParking,
    filters.onlyNewOrRenovated,
    filters.onlyKnownTotal,
    filters.strictRadius,
    filters.neighborhoods.length > 0,
    filters.sources.length > 0,
    filters.sortBy !== DEFAULT_FILTERS.sortBy,
  ].filter(Boolean).length
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'nao informado'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export default App
