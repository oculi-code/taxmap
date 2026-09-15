import type { TaxComponent, TaxInput } from '../../types'
import { taxFromBrackets } from './bracket'
import { genericApproxLabel } from './labels'
import type { Bracket } from './types'

/**
 * Rough, illustrative approximation of a "typical" Swiss canton's combined
 * cantonal + communal + church tax burden. Used ONLY for cantons that don't
 * have a dedicated module under src/tax/ch/ yet (see cantonRegistry.ts).
 * These numbers are NOT derived from any single canton's actual law — they're
 * a plausible placeholder curve so the whole country is explorable, and
 * should always be shown to the user as an approximation.
 */
const GENERIC_INCOME_BRACKETS: { single: Bracket[]; married: Bracket[] } = {
  single: [
    { from: 0, rate: 0 },
    { from: 20000, rate: 0.04 },
    { from: 40000, rate: 0.08 },
    { from: 70000, rate: 0.11 },
    { from: 120000, rate: 0.13 },
    { from: 200000, rate: 0.145 },
    { from: 500000, rate: 0.155 },
  ],
  married: [
    { from: 0, rate: 0 },
    { from: 35000, rate: 0.04 },
    { from: 65000, rate: 0.08 },
    { from: 110000, rate: 0.11 },
    { from: 180000, rate: 0.13 },
    { from: 280000, rate: 0.145 },
    { from: 600000, rate: 0.155 },
  ],
}

const GENERIC_WEALTH_BRACKETS: Bracket[] = [
  { from: 0, rate: 0 },
  { from: 100000, rate: 0.0015 },
  { from: 500000, rate: 0.003 },
  { from: 1000000, rate: 0.004 },
]

export function computeGenericCantonalComponents(input: TaxInput, taxableIncome: number): TaxComponent[] {
  const brackets = input.maritalStatus === 'married' ? GENERIC_INCOME_BRACKETS.married : GENERIC_INCOME_BRACKETS.single
  const incomeTax = taxFromBrackets(taxableIncome, brackets)
  const wealthTax = taxFromBrackets(input.wealth, GENERIC_WEALTH_BRACKETS)
  return [
    {
      label: genericApproxLabel(),
      baseTax: taxableIncome + input.wealth,
      multiplier: null,
      amount: incomeTax + wealthTax,
    },
  ]
}
