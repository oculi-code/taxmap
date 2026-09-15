import type { TaxComponent } from '../../../types'
import { taxFromBrackets } from '../../lib/bracket'
import type { CantonTaxModule } from '../../lib/cantonModule'
import { churchSplitParts } from '../../lib/churchSplit'
import { cantonalTaxLabel, churchTaxLabel, municipalTaxLabel } from '../../lib/labels'
import data from './be.data.json'
import municipalities from './be.municipalities.json'

/**
 * Bern: 3 layers, all percent-of-"einfache Steuer" — cantonal, municipal,
 * church. Married/single are wholly separate statutory tariffs (not a
 * splitting divisor). Wealth tax has a genuine cliff exemption below
 * CHF 100'000 (Art. 65 Abs. 3 StG): below it, wealth tax is zero outright,
 * even though the bracket table's own first band would otherwise produce a
 * small positive amount between roughly CHF 36'000-100'000.
 */
export const be: CantonTaxModule = {
  computeComponents(input, taxableIncome, bfsNumber): TaxComponent[] {
    const incomeBrackets = input.maritalStatus === 'married' ? data.incomeTax.married : data.incomeTax.single
    const wealthTax = input.wealth < data.wealthTaxExemptionThreshold ? 0 : taxFromBrackets(input.wealth, data.wealthTax)
    const baseTax = taxFromBrackets(taxableIncome, incomeBrackets) + wealthTax

    const cantonalFraction = data.cantonalMultiplierPercent / 100
    const components: TaxComponent[] = [
      { label: cantonalTaxLabel('BE'), baseTax, multiplier: cantonalFraction, amount: baseTax * cantonalFraction },
    ]

    const muni = bfsNumber != null ? municipalities.find((m) => m.bfsNumber === bfsNumber) : undefined
    if (muni) {
      const muniFraction = muni.municipalMultiplierPercent / 100
      components.push({
        label: municipalTaxLabel(muni.name),
        baseTax,
        multiplier: muniFraction,
        amount: baseTax * muniFraction,
      })

      for (const part of churchSplitParts(input)) {
        const churchPercent =
          part.faith === 'reformed' ? muni.churchMultiplierReformedPercent : muni.churchMultiplierCatholicPercent
        if (!churchPercent) continue
        const churchFraction = churchPercent / 100
        const partBase = baseTax * part.fraction
        components.push({
          label: churchTaxLabel(part),
          baseTax: partBase,
          multiplier: churchFraction,
          amount: partBase * churchFraction,
        })
      }
    }

    return components
  },
}
