export type TransactionType = 'rent' | 'sale'

export type DataConfidence = 'confirmed' | 'estimated' | 'missing'

export type ListingSource =
  | 'ZAP Imoveis'
  | 'VivaReal'
  | 'OLX'
  | 'QuintoAndar'
  | 'Imovelweb'
  | 'Lugar Certo'
  | 'Chaves na Mao'
  | 'Outro'

export interface Coordinates {
  lat: number
  lon: number
}

export interface ListingCosts {
  rent?: number
  condominium?: number
  iptu?: number
  insurance?: number
  other?: number
  monthlyTotal?: number
  monthlyTotalConfidence: DataConfidence
  salePrice?: number
  pricePerSquareMeter?: number
}

export interface Listing {
  id: string
  source: ListingSource
  sourceListingId?: string
  url: string
  title: string
  transaction: TransactionType
  neighborhood?: string
  address?: string
  coordinates?: Coordinates
  distanceKm?: number
  distanceConfidence: DataConfidence
  bedrooms?: number
  bathrooms?: number
  parkingSpaces?: number
  areaM2?: number
  isNewOrRenovated: boolean
  newOrRenovatedEvidence?: string
  contactName?: string
  contactPhone?: string
  images: string[]
  costs: ListingCosts
  collectedAt: string
  rawText?: string
  warnings: string[]
}

export interface SourceRunReport {
  source: ListingSource
  status: 'ok' | 'blocked-by-robots' | 'failed' | 'skipped'
  url: string
  message: string
  collected: number
  startedAt: string
  finishedAt: string
}

export interface ListingsDataset {
  generatedAt: string
  center: SearchCenter
  radiusKm: number
  strictRadiusDefault: boolean
  listings: Listing[]
  reports: SourceRunReport[]
  notices: string[]
}

export interface SearchCenter {
  label: string
  address: string
  coordinates: Coordinates
  coordinateSource: string
}

export interface FinancingInput {
  propertyPrice: number
  downPayment: number
  fgts: number
  annualInterestRate: number
  termMonths: number
  grossMonthlyIncome: number
  insuranceMipMonthlyRate: number
  insuranceDfiMonthlyRate: number
  adminFeeMonthly: number
  amortization: 'SAC' | 'PRICE'
}

export interface FinancingMonth {
  month: number
  payment: number
  principal: number
  interest: number
  insurance: number
  adminFee: number
  balance: number
}

export interface FinancingResult {
  financedAmount: number
  firstPayment: number
  lastPayment: number
  totalPaid: number
  totalInterest: number
  totalInsuranceAndFees: number
  requiredIncomeAt30Percent: number
  incomeCommitmentFirstPayment: number
  eligibleByIncome: boolean
  schedule: FinancingMonth[]
}
