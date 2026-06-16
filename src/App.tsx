import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  BadgeCheck,
  Calculator,
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
import { DEFAULT_RADIUS_KM, SEARCH_CENTER } from './domain/config'
import { DEFAULT_FILTERS, filterListings, uniqueNeighborhoods } from './domain/filters'
import type { ListingFilters } from './domain/filters'
import { formatCurrency } from './domain/money'
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
  const confirmedInsideRadius = dataset.listings.filter(
    (listing) => typeof listing.distanceKm === 'number' && listing.distanceKm <= DEFAULT_RADIUS_KM,
  ).length
  const rentListingsWithTotal = rentListings.filter((listing) => listing.costs.monthlyTotal)
  const averageRent =
    rentListingsWithTotal.length > 0
      ? rentListingsWithTotal.reduce((total, listing) => total + (listing.costs.monthlyTotal ?? 0), 0) /
        rentListingsWithTotal.length
      : undefined

  return (
    <main className="app-shell">
      <section className="toolbar" aria-label="Painel principal">
        <div>
          <p className="eyebrow">Buscador de Imovel BH</p>
          <h1>Apartamentos ate 3,5 km da Av. Brasil, 1666</h1>
          <p className="subtitle">
            Ranking por custo-beneficio, duas vagas, raio do CMU, imovel novo/reformado e custo
            mensal total quando informado pelo portal.
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
        <Metric icon={<Home />} label="Imoveis visiveis" value={String(visibleListings.length)} />
        <Metric icon={<MapPinned />} label="No raio configurado" value={String(confirmedInsideRadius)} />
        <Metric icon={<Car />} label="Com 2+ vagas" value={String(dataset.listings.filter((listing) => (listing.parkingSpaces ?? 0) >= 2).length)} />
        <Metric icon={<CircleDollarSign />} label="Aluguel medio filtrado" value={formatCurrency(averageRent)} />
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
              <option value="all">Alugar e comprar</option>
              <option value="rent">Aluguel</option>
              <option value="sale">Venda</option>
            </select>
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
            Somente raio conhecido/estimado ate {DEFAULT_RADIUS_KM} km
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
              neighborhoods.map((neighborhood) => (
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
                  {neighborhood}
                </label>
              ))
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
              <p className="eyebrow">Melhor custo-beneficio filtrado</p>
              <h2>{bestListing ? bestListing.title : 'Nenhum anuncio no filtro atual'}</h2>
              <p>
                {bestListing
                  ? `${bestListing.source} - score ${scoreListing(bestListing)} - ${bestListing.neighborhood ?? 'bairro nao informado'}`
                  : 'Ajuste filtros ou gere uma nova coleta.'}
              </p>
            </div>
            <Sparkles aria-hidden="true" />
          </div>

          <MapPanel listings={visibleListings} center={SEARCH_CENTER} />

          <ListingTable title="Aluguel" listings={rentListings} />
          <ListingTable title="Venda" listings={saleListings} />

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

      <section className="simulator-section" aria-label="Simulador de financiamento">
        <div className="section-title">
          <Calculator size={18} aria-hidden="true" />
          <h2>Simulador de financiamento</h2>
        </div>
        <FinancingPanel
          key={saleListings[0]?.costs.salePrice ?? 'default-financing'}
          suggestedPrice={saleListings[0]?.costs.salePrice}
        />
      </section>
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
