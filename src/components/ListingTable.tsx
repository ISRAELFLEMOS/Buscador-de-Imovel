import { ExternalLink, ImageOff, MapPin, Phone } from 'lucide-react'
import { formatCurrency } from '../domain/money'
import { priceBandLabel, salePriceBand, scoreListing } from '../domain/ranking'
import type { Listing } from '../domain/types'

export function ListingTable({ title, listings }: { title: string; listings: Listing[] }) {
  return (
    <section className="listing-section" aria-label={title}>
      <div className="section-title">
        <h2>{title}</h2>
        <span>{listings.length} anuncios</span>
      </div>
      {listings.length === 0 ? (
        <p className="muted">Nenhum anuncio encontrado neste filtro.</p>
      ) : (
        <div className="listing-grid">
          {listings.map((listing) => (
            <article className="listing-card" key={listing.id}>
              <div className="image-slot">
                {listing.images[0] ? (
                  <img src={listing.images[0]} alt="" loading="lazy" />
                ) : (
                  <ImageOff size={24} aria-hidden="true" />
                )}
                <span>{listing.source}</span>
              </div>
              <div className="listing-body">
                <div className="listing-heading">
                  <h3>{listing.title}</h3>
                  <strong>{scoreListing(listing)}</strong>
                </div>
                <p className="muted">
                  {listing.neighborhood ?? 'Bairro nao informado'} -{' '}
                  {typeof listing.distanceKm === 'number'
                    ? `${listing.distanceKm.toFixed(1)} km (${listing.distanceConfidence})`
                    : 'distancia incerta'}
                </p>
                <dl className="facts">
                  <div>
                    <dt>Preco</dt>
                    <dd>
                      {listing.transaction === 'rent'
                        ? formatCurrency(listing.costs.monthlyTotal ?? listing.costs.rent)
                        : formatCurrency(listing.costs.salePrice)}
                    </dd>
                  </div>
                  <div>
                    <dt>Vagas</dt>
                    <dd>{listing.parkingSpaces ?? 'N/I'}</dd>
                  </div>
                  <div>
                    <dt>Area</dt>
                    <dd>{listing.areaM2 ? `${listing.areaM2} m2` : 'N/I'}</dd>
                  </div>
                  <div>
                    <dt>Faixa</dt>
                    <dd>{listing.transaction === 'sale' ? priceBandLabel(salePriceBand(listing)) : 'Aluguel'}</dd>
                  </div>
                </dl>

                {listing.transaction === 'rent' ? (
                  <div className="cost-breakdown">
                    <span>Aluguel {formatCurrency(listing.costs.rent)}</span>
                    <span>Cond. {formatCurrency(listing.costs.condominium)}</span>
                    <span>IPTU {formatCurrency(listing.costs.iptu)}</span>
                    <span>Seguro {formatCurrency(listing.costs.insurance)}</span>
                  </div>
                ) : null}

                <div className="tag-row">
                  <span>{listing.isNewOrRenovated ? 'Novo/reformado' : 'Sem evidencia de reforma'}</span>
                  <span>ID {listing.sourceListingId ?? 'nao visivel'}</span>
                </div>

                <div className="listing-actions">
                  <span>
                    <Phone size={15} aria-hidden="true" />
                    {listing.contactPhone ?? listing.contactName ?? 'Contato no link'}
                  </span>
                  <span>
                    <MapPin size={15} aria-hidden="true" />
                    {listing.address ?? 'Endereco parcial'}
                  </span>
                  <a href={listing.url} target="_blank" rel="noreferrer">
                    Ver anuncio
                    <ExternalLink size={15} aria-hidden="true" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
