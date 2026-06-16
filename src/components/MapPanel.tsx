import type { Listing, SearchCenter } from '../domain/types'

export function MapPanel({ listings, center }: { listings: Listing[]; center: SearchCenter }) {
  const plotted = listings
    .filter((listing) => typeof listing.distanceKm === 'number')
    .slice(0, 24)
    .map((listing, index) => {
      const distanceRatio = Math.min(1, (listing.distanceKm ?? 0) / 3.5)
      const angle = (index * 137.5 * Math.PI) / 180
      const radius = 8 + distanceRatio * 38
      return {
        listing,
        left: 50 + Math.cos(angle) * radius,
        top: 50 + Math.sin(angle) * radius,
      }
    })

  return (
    <section className="map-panel" aria-label="Mapa simplificado">
      <div>
        <p className="eyebrow">Centro da busca</p>
        <h2>{center.label}</h2>
        <p>{center.address}</p>
        <small>{center.coordinateSource}</small>
      </div>
      <div className="map-visual" role="img" aria-label="Mapa radial simplificado dos anuncios">
        <div className="radius radius-outer" />
        <div className="radius radius-inner" />
        <div className="center-dot">CMU</div>
        {plotted.map(({ listing, left, top }) => (
          <a
            key={listing.id}
            className={listing.transaction === 'sale' ? 'map-dot sale' : 'map-dot rent'}
            href={listing.url}
            target="_blank"
            rel="noreferrer"
            style={{ left: `${left}%`, top: `${top}%` }}
            title={`${listing.title} - ${listing.distanceKm} km`}
          />
        ))}
      </div>
    </section>
  )
}
