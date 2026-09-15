import type { CantonCode, SeparateTaxationComparison, TaxBreakdown, TaxInput } from '../../types'
import { computeFederalIncomeTax } from '../ch/federal'
import { getCantonModule } from './cantonRegistry'
import { computeGenericCantonalComponents } from './generic'
import { federalTaxLabel } from './labels'

export function computeTaxBreakdown(input: TaxInput, cantonCode: CantonCode | null, bfsNumber: number | null): TaxBreakdown {
  const fed = computeFederalIncomeTax(input)
  const cantonModule = cantonCode ? getCantonModule(cantonCode) : null

  const components = [
    { label: federalTaxLabel(), baseTax: fed.taxableIncome, multiplier: null, amount: fed.tax },
    ...(cantonModule
      ? cantonModule.computeComponents(input, fed.taxableIncome, bfsNumber)
      : computeGenericCantonalComponents(input, fed.taxableIncome)),
  ]

  const totalTax = components.reduce((sum, c) => sum + c.amount, 0)
  const warnings = [...new Set(components.map((c) => c.warning).filter((w): w is string => w != null))]

  return {
    grossIncome: fed.grossIncome,
    deductions: fed.deductions,
    credits: fed.credits,
    taxableIncome: fed.taxableIncome,
    taxableWealth: input.wealth,
    components,
    totalTax,
    effectiveRate: fed.grossIncome > 0 ? totalTax / fed.grossIncome : 0,
    precise: cantonModule != null,
    warnings,
  }
}

/**
 * Illustrative preview of "separate taxation" (Individualbesteuerung), a
 * federal reform that is proposed but not yet law and has no finalized
 * official formula. Simulated here as: each spouse is taxed as if filing
 * individually (single rate schedule) on their own income, wealth split
 * evenly between them. This is a simulation for illustration, not an
 * authoritative calculation.
 */
export function computeSeparateTaxationPreview(
  input: TaxInput,
  cantonCode: CantonCode | null,
  bfsNumber: number | null,
): SeparateTaxationComparison | null {
  if (input.maritalStatus !== 'married') return null

  const joint = computeTaxBreakdown(input, cantonCode, bfsNumber)

  const halfWealth = input.wealth / 2
  const spouseA: TaxInput = {
    ...input,
    maritalStatus: 'single',
    income: input.income,
    spouseIncome: 0,
    wealth: halfWealth,
    faith: input.faith,
    spouseFaith: 'none',
  }
  const spouseB: TaxInput = {
    ...input,
    maritalStatus: 'single',
    income: input.spouseIncome,
    spouseIncome: 0,
    wealth: halfWealth,
    // Spouse B's own confession is what was entered as "spouse's religion" —
    // without this override it would inherit the primary filer's `faith`
    // from the spread above, taxing the wrong person's church.
    faith: input.spouseFaith,
    spouseFaith: 'none',
  }

  const a = computeTaxBreakdown(spouseA, cantonCode, bfsNumber)
  const b = computeTaxBreakdown(spouseB, cantonCode, bfsNumber)
  const separateTotal = a.totalTax + b.totalTax

  return { jointTotal: joint.totalTax, separateTotal, difference: separateTotal - joint.totalTax }
}
