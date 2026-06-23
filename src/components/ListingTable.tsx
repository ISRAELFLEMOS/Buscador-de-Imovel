import { ExternalLink, ImageOff, MapPin, Phone, TriangleAlert } from 'lucide-react'
import { listingPreviewImages } from '../domain/images'
import { formatCurrency } from '../domain/money'
import { safetyAttentionLabel } from '../domain/neighborhoods'
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
          {listings.map((listing) => {
            const safetyLabel = safetyAttentionLabel(listing.neighborhood)
            const previewImages = listingPreviewImages(listing.images)

            return (
              <article className="listing-card" key={listing.id}>
                <div className="image-slot">
                  {previewImages.primary ? (
                    <img src={previewImages.primary} alt="" loading="lazy" />
                  ) : (
                    <ImageOff size={24} aria-hidden="true" />
                  )}
                  <span className="source-badge">{listing.source}</span>
                  {previewImages.thumbnails.length > 0 ? (
                    <div className="image-thumbs" aria-label="Mais fotos do anuncio">
                      {previewImages.thumbnails.map((image) => (
                        <img key={image} src={image} alt="" loading="lazy" />
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="listing-body">
                  <div className="listing-heading">
                    <div>
                      <p className="listing-kicker">
                        {listing.neighborhood ?? 'Bairro nao informado'} -{' '}
                        {typeof listing.distanceKm === 'number'
                          ? `${listing.distanceKm.toFixed(1)} km`
                          : 'distancia incerta'}
                      </p>
                      <h3>{listing.title}</h3>
                    </div>
                    <div className="score-box">
                      <strong>{scoreListing(listing)}</strong>
                      <span>score</span>
                    </div>
                  </div>
                  <dl className="facts">
                    <div>
                      <dt>{listing.transaction === 'rent' ? 'Custo total' : 'Preco'}</dt>
                      <dd>
                        {listing.transaction === 'rent'
                          ? formatCurrency(listing.costs.monthlyTotal ?? listing.costs.rent)
                          : formatCurrency(listing.costs.salePrice)}
                      </dd>
                    </div>
                    {listing.transaction === 'rent' ? (
                      <div>
                        <dt>Aluguel base</dt>
                        <dd>{formatCurrency(listing.costs.rent)}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt>Quartos</dt>
                      <dd>{listing.bedrooms ?? 'N/I'}</dd>
                    </div>
                    <div>
                      <dt>Banheiros</dt>
                      <dd>{listing.bathrooms ?? 'N/I'}</dd>
                    </div>
                    <div>
                      <dt>Vagas</dt>
                      <dd>{listing.parkingSpaces ?? 'N/I'}</dd>
                    </div>
                    <div>
                      <dt>Area</dt>
                      <dd>{listing.areaM2 ? `${listing.areaM2} m2` : 'N/I'}</dd>
                    </div>
                    {listing.transaction === 'sale' ? (
                      <div>
                        <dt>Faixa</dt>
                        <dd>{priceBandLabel(salePriceBand(listing))}</dd>
                      </div>
                    ) : null}
                  </dl>

                  {listing.transaction === 'rent' ? (
                    <div className="cost-breakdown">
                      <span>Aluguel {formatCurrency(listing.costs.rent)}</span>
                      <span>Cond. {formatCurrency(listing.costs.condominium)}</span>
                      <span>IPTU {formatCurrency(listing.costs.iptu)}</span>
                      <span>Seguro {formatCurrency(listing.costs.insurance)}</span>
                      {typeof listing.costs.other === 'number' ? (
                        <span>Taxas {formatCurrency(listing.costs.other)}</span>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="tag-row">
                    <span>{listing.isNewOrRenovated ? 'Novo/reformado' : 'Sem evidencia de reforma'}</span>
                    {safetyLabel ? (
                      <span className="danger-tag">
                        <TriangleAlert size={14} aria-hidden="true" />
                        {safetyLabel}
                      </span>
                    ) : null}
                    {listing.transaction === 'rent' ? (
                      <span>
                        {listing.costs.monthlyTotalConfidence === 'confirmed'
                          ? 'Total informado pelo portal'
                          : 'Total estimado'}
                      </span>
                    ) : null}
                    <span>ID {listing.sourceListingId ?? 'nao visivel'}</span>
                    <span>{listing.distanceConfidence === 'estimated' ? 'Distancia estimada' : listing.distanceConfidence}</span>
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
            )
          })}
        </div>
      )}
    </section>
  )
}
