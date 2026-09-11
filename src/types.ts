export type CantonCode =
  | 'ZH' | 'BE' | 'LU' | 'UR' | 'SZ' | 'OW' | 'NW' | 'GL' | 'ZG' | 'FR'
  | 'SO' | 'BS' | 'BL' | 'SH' | 'AR' | 'AI' | 'SG' | 'GR' | 'AG' | 'TG'
  | 'TI' | 'VD' | 'VS' | 'NE' | 'GE' | 'JU'

export interface Canton {
  id: number
  code: CantonCode
  name: string
}

export interface MunicipalityListEntry {
  bfsNumber: number
  name: string
  cantonCode: string | null
}

export type Faith = 'none' | 'reformed' | 'catholic'
export type MaritalStatus = 'single' | 'married'

export interface TaxInput {
  maritalStatus: MaritalStatus
  /** Taxable income of the primary filer (or the couple's combined income, if
   * `spouseIncome` is left at 0 and they don't want to model separate incomes). */
  income: number
  /** Only used when maritalStatus === 'married': the second spouse's own taxable
   * income, kept separate so we can preview individual/separate taxation. */
  spouseIncome: number
  wealth: number
  numberOfChildren: number
  /** The primary filer's own confession — see src/tax/lib/churchSplit.ts for
   * how this and `spouseFaith` combine into church tax when married. */
  faith: Faith
  /** Only used when maritalStatus === 'married': the spouse's own confession,
   * kept separate since Swiss church tax splits between spouses of differing
   * confessions rather than applying one shared household faith. */
  spouseFaith: Faith
  bfsNumber: number | null
}

export interface DeductionLine {
  label: string
  amount: number
}

export interface TaxComponent {
  label: string
  baseTax: number
  multiplier: number | null
  amount: number
  /** Set when this component's rate is a stand-in estimate rather than a
   * confirmed official figure (e.g. a municipality mid-merger or awaiting a
   * pending referendum) — shown as a row-level and banner-level warning
   * rather than presented as an ordinary modeled rate. */
  warning?: string
}

export interface TaxBreakdown {
  grossIncome: number
  deductions: DeductionLine[]
  /** Amounts credited directly off the computed tax (not off income), e.g. the
   * federal per-child Elterntarif credit. */
  credits: DeductionLine[]
  taxableIncome: number
  taxableWealth: number
  components: TaxComponent[]
  totalTax: number
  effectiveRate: number
  precise: boolean
  /** Deduplicated warnings collected from any component (see TaxComponent.warning). */
  warnings: string[]
}

export interface SeparateTaxationComparison {
  jointTotal: number
  separateTotal: number
  difference: number
}
