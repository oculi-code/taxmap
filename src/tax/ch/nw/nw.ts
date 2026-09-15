import type { TaxComponent } from '../../../types'
import { taxFromBrackets } from '../../lib/bracket'
import type { CantonTaxModule } from '../../lib/cantonModule'
import { churchSplitParts } from '../../lib/churchSplit'
import { cantonalTaxLabel, churchTaxLabel, municipalTaxLabel } from '../../lib/labels'
import data from './nw.data.json'
import municipalities from './nw.municipalities.json'

/**
 * Nidwalden: an 18-step progressive schedule up to 3.3%, but above a
 * threshold (CHF 166'300 single / 307'655 married — the same 1.85 splitting
 * divisor NW uses for marital status) the ENTIRE income is taxed at a flat
 * average 2.75% instead — lower than the marginal rate just below it, a
 * deliberate regressive "rate cap". This is NOT a seamless continuation of
 * the bracket table (verified against source: the cap and the cumulative
 * marginal total at the boundary are close but not exactly equal), so it's
 * handled as a distinct flat rule rather than a trailing bracket entry.
 * Cantonal + municipal multipliers are both raw factors (Einheiten) applied
 * identically to income and wealth. Reformed church is a uniform 0.26
 * canton-wide; catholic varies per municipality.
 */
export const nw: CantonTaxModule = {
  computeComponents(input, taxableIncome, bfsNumber): TaxComponent[] {
    const married = input.maritalStatus === 'married'
    const brackets = married ? data.incomeTax.married : data.incomeTax.single
    const capThreshold = married ? data.incomeTaxCapThreshold.married : data.incomeTaxCapThreshold.single
    const incomeBase =
      taxableIncome >= capThreshold ? taxableIncome * data.incomeTaxCapRate : taxFromBrackets(taxableIncome, brackets)
    const baseTax = incomeBase + taxFromBrackets(input.wealth, data.wealthTax)

    const cantonalFraction = data.cantonalMultiplierFactor
    const components: TaxComponent[] = [
      { label: cantonalTaxLabel('NW'), baseTax, multiplier: cantonalFraction, amount: baseTax * cantonalFraction },
    ]

    const muni = bfsNumber != null ? municipalities.find((m) => m.bfsNumber === bfsNumber) : undefined
    if (muni) {
      const muniFraction = muni.municipalMultiplierFactor
      components.push({
        label: municipalTaxLabel(muni.name),
        baseTax,
        multiplier: muniFraction,
        amount: baseTax * muniFraction,
      })

      for (const part of churchSplitParts(input)) {
        const churchFactor =
          part.faith === 'reformed' ? data.churchMultiplierReformedFactor : muni.churchMultiplierCatholicFactor
        if (!churchFactor) continue
        const partBase = baseTax * part.fraction
        components.push({
          label: churchTaxLabel(part),
          baseTax: partBase,
          multiplier: churchFactor,
          amount: partBase * churchFactor,
        })
      }
    }

    return components
  },
}
