import type { SearchCenter } from './types'

export const SEARCH_CENTER: SearchCenter = {
  label: 'Avenida Brasil, 1666',
  address: 'Avenida Brasil, 1666, Boa Viagem, Belo Horizonte, MG, 30140-004',
  coordinates: {
    lat: -19.9313091,
    lon: -43.93434,
  },
  coordinateSource:
    'Coordenada aproximada por Nominatim/OpenStreetMap para o segmento da Avenida Brasil na regiao Boa Viagem/Savassi.',
}

export const DEFAULT_RADIUS_KM = 3.9
export const DEFAULT_MAX_RENT_TOTAL = 4500

export const PRIMARY_PREFERRED_NEIGHBORHOODS = ['Santa Teresa', 'Santa Efigenia'] as const
export const SECONDARY_PREFERRED_NEIGHBORHOODS = [
  'Floresta',
  'Sagrada Familia',
  'Savassi',
  'Anchieta',
  'Funcionarios',
  'Sao Pedro',
] as const
export const PREFERRED_NEIGHBORHOODS = [
  ...PRIMARY_PREFERRED_NEIGHBORHOODS,
  ...SECONDARY_PREFERRED_NEIGHBORHOODS,
] as const

export const SAFETY_ATTENTION_NEIGHBORHOODS = ['Centro', 'Barro Preto'] as const

export const CENTRAL_BH_NEIGHBORHOODS = [
  'Anchieta',
  'Barro Preto',
  'Boa Viagem',
  'Centro',
  'Cruzeiro',
  'Funcionarios',
  'Floresta',
  'Lourdes',
  'Santa Efigenia',
  'Santa Teresa',
  'Santo Agostinho',
  'Santo Antonio',
  'Sao Pedro',
  'Sagrada Familia',
  'Savassi',
  'Serra',
  'Sion',
]

export const NEIGHBORHOOD_COORDINATES: Record<string, { lat: number; lon: number }> = {
  anchieta: { lat: -19.9465, lon: -43.9265 },
  'barro preto': { lat: -19.9188, lon: -43.9503 },
  'boa viagem': { lat: -19.9289, lon: -43.9343 },
  centro: { lat: -19.9191, lon: -43.9386 },
  cruzeiro: { lat: -19.9451, lon: -43.9265 },
  funcionarios: { lat: -19.9322, lon: -43.9298 },
  floresta: { lat: -19.9186, lon: -43.9226 },
  lourdes: { lat: -19.9278, lon: -43.9437 },
  'santa efigenia': { lat: -19.9256, lon: -43.9207 },
  'santa teresa': { lat: -19.9189, lon: -43.9156 },
  'santo agostinho': { lat: -19.9253, lon: -43.9536 },
  'santo antonio': { lat: -19.9398, lon: -43.9464 },
  'sao pedro': { lat: -19.9398, lon: -43.9352 },
  'sagrada familia': { lat: -19.9006, lon: -43.9188 },
  savassi: { lat: -19.9367, lon: -43.9342 },
  serra: { lat: -19.9442, lon: -43.9224 },
  sion: { lat: -19.9522, lon: -43.9317 },
}
