import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  BadgeCheck,
  Car,
  CircleDollarSign,
  ExternalLink,
  Filter,
  Home,
  MapPinned,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import './App.css'
import { FinancingPanel } from './components/FinancingPanel'
import { ListingTable } from './components/ListingTable'
import { MapPanel } from './components/MapPanel'
import { DEFAULT_MAX_RENT_TOTAL, DEFAULT_RADIUS_KM, SEARCH_CENTER } from './domain/config'
import { DEFAULT_FILTERS, filterListings, uniqueNeighborhoods } from './domain/filters'
import type { ListingFilters } from './domain/filters'
import { formatCurrency } from './domain/money'
import { neighborhoodPreferenceLabel } from './domain/neighborhoods'
import { scoreListing, sortByCostBenefit } from './domain/ranking'
import type { ListingsDataset } from './domain/types'
import { emptyDataset } from './data/emptyDataset'

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
  const visibleListings = useMemo(
    () => sortByCostBenefit(filterListings(dataset.listings, filters)),
    [dataset.listings, filters],
  )
  const rentListings = visibleListings.filter((listing) => listing.transaction === 'rent')
  const saleListings = visibleListings.filter((listing) => listing.transaction === 'sale')
  const bestListing = visibleListings[0]
  const confirmedInsideRadius = visibleListings.filter(
    (listing) => typeof listing.distanceKm === 'number' && listing.distanceKm <= DEFAULT_RADIUS_KM,
  ).length
  const rentalsUnderLimit = dataset.listings.filter((listing) => {
    const rentTotal = listing.costs.monthlyTotal ?? listing.costs.rent
    return listing.transaction === 'rent' && typeof rentTotal === 'number' && rentTotal <= DEFAULT_MAX_RENT_TOTAL
  }).length

  return (
    <main className="app-shell">
      <section className="toolbar" aria-label="Painel principal">
        <div>
          <p className="eyebrow">Buscador de Imovel BH</p>
          <h1>Alugueis perto da Avenida Brasil, 1666</h1>
          <p className="subtitle">
            Teste inicial focado em apartamentos para alugar, com teto padrao de R$ 4.500, raio
            de ate 3,8 km, preferencia por Santa Teresa, Santa Efigenia e Floresta, duas vagas e custo
            mensal total quando informado.
          </p>
        </div>
        <div className="toolbar-actions">
          <a className="icon-link" href="https://github.com/israelflemos/Buscador-de-Imovel" target="_blank" rel="noreferrer">
            <ExternalLink size={18} aria-hidden="true" />
            GitHub
          </a>
          <span className="status-pill">
            <RefreshCw size={16} aria-hidden="true" />
            {loadState === 'loading'
              ? 'Carregando coleta'
              : `Atualizado ${formatDate(dataset.generatedAt)}`}
          </span>
        </div>
      </section>

      <section className="summary-grid" aria-label="Resumo da busca">
        <Metric icon={<Home />} label="Alugueis visiveis" value={String(rentListings.length)} />
        <Metric icon={<MapPinned />} label="No raio filtrado" value={String(confirmedInsideRadius)} />
        <Metric icon={<Car />} label="Com 2+ vagas" value={String(rentListings.filter((listing) => (listing.parkingSpaces ?? 0) >= 2).length)} />
        <Metric icon={<CircleDollarSign />} label="Ate R$ 4,5 mil coletados" value={String(rentalsUnderLimit)} />
      </section>

      <section className="workspace-grid">
        <aside className="filter-panel" aria-label="Filtros">
          <div className="section-title">
            <Filter size={18} aria-hidden="true" />
            <h2>Filtros</h2>
          </div>

          <label>
            Operacao
            <select
              value={filters.transaction}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  transaction: event.target.value as ListingFilters['transaction'],
                }))
              }
            >
              <option value="rent">Aluguel</option>
              <option value="all">Todas as operacoes</option>
              <option value="sale">Venda</option>
            </select>
          </label>

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

          <label>
            Busca livre
            <div className="search-input">
              <Search size={16} aria-hidden="true" />
              <input
                value={filters.query}
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                placeholder="bairro, portal, caracteristica"
              />
            </div>
          </label>

          <label>
            Vagas minimas
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

          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={filters.strictRadius}
              onChange={(event) =>
                setFilters((current) => ({ ...current, strictRadius: event.target.checked }))
              }
            />
            Restringir ao raio conhecido/estimado ate {DEFAULT_RADIUS_KM} km
          </label>

          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={filters.onlyNewOrRenovated}
              onChange={(event) =>
                setFilters((current) => ({ ...current, onlyNewOrRenovated: event.target.checked }))
              }
            />
            Novo ou reformado
          </label>

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

          {dataset.notices.map((notice) => (
            <div className="notice" key={notice}>
              <ShieldAlert size={18} aria-hidden="true" />
              <span>{notice}</span>
            </div>
          ))}

          <div className="best-strip">
            <div>
              <p className="eyebrow">Menor aluguel com bom encaixe</p>
              <h2>{bestListing ? bestListing.title : 'Nenhum anuncio no filtro atual'}</h2>
              <p>
                {bestListing
                  ? `${bestListing.source} - ${formatCurrency(bestListing.costs.monthlyTotal ?? bestListing.costs.rent)} - score ${scoreListing(bestListing)} - ${bestListing.neighborhood ?? 'bairro nao informado'}`
                  : 'Ajuste filtros ou gere uma nova coleta.'}
              </p>
            </div>
            <Sparkles aria-hidden="true" />
          </div>

          <MapPanel listings={visibleListings} center={SEARCH_CENTER} />

          <ListingTable
            title={`Alugueis ate ${formatCurrency(filters.maxRentTotal)}`}
            listings={rentListings}
          />

          {filters.transaction !== 'rent' ? <ListingTable title="Venda" listings={saleListings} /> : null}

          <section className="reports" aria-label="Relatorio das fontes">
            <div className="section-title">
              <BadgeCheck size={18} aria-hidden="true" />
              <h2>Fontes e bloqueios</h2>
            </div>
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
          </section>
        </section>
      </section>

      <details className="simulator-section" aria-label="Simulador de financiamento">
        <summary>Simulador de financiamento para uma etapa futura</summary>
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
