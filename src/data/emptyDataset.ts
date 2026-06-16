import { DEFAULT_RADIUS_KM, SEARCH_CENTER } from '../domain/config'
import type { ListingsDataset } from '../domain/types'

export const emptyDataset: ListingsDataset = {
  generatedAt: new Date(0).toISOString(),
  center: SEARCH_CENTER,
  radiusKm: DEFAULT_RADIUS_KM,
  strictRadiusDefault: false,
  listings: [],
  reports: [],
  notices: [
    'Nenhuma coleta foi carregada ainda. Execute npm run scrape para gerar public/data/listings.json.',
  ],
}
