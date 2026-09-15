import type { TaxComponent } from '../../../types'
import { taxFromBrackets } from '../../lib/bracket'
import type { CantonTaxModule } from '../../lib/cantonModule'
import { churchSplitParts } from '../../lib/churchSplit'
import { cantonalTaxLabel, churchTaxLabel, municipalTaxLabel } from '../../lib/labels'
import data from './ur.data.json'
import municipalities from './ur.municipalities.json'

/**
 * Uri: genuinely flat-rate (no progressive brackets at all) — 7.1% income /
 * 1.0‰ wealth, identically at BOTH the cantonal and municipal layer (Art.
 * 1389/1390 area of the Kantonsblatt sets the municipal "einfache Steuer" to
 * the same base rate as the canton), each then multiplied by its own
 * Steuerfuss. The church layer uses a distinct, lower base rate (1% income /
 * 0.3‰ wealth). Reformed church is a uniform 115% canton-wide rate (a
 * handful of sub-municipal exception parishes exist but are below this
 * app's BFS-municipality granularity); catholic varies per municipality.
 * Progressivity/family relief lives entirely in (unmodeled) fixed-CHF
 * deductions, not in the rate — this app reuses the federal deduction
 * schedule everywhere, as documented at the app level.
 */
export const ur: CantonTaxModule = {
  computeComponents(input, taxableIncome, bfsNumber): TaxComponent[] {
    const cantonalBase = taxFromBrackets(taxableIncome, data.incomeTax) + taxFromBrackets(input.wealth, data.wealthTax)
    const cantonalFraction = data.cantonalMultiplierPercent / 100
    const components: TaxComponent[] = [
      {
        label: cantonalTaxLabel('UR'),
        baseTax: cantonalBase,
        multiplier: cantonalFraction,
        amount: cantonalBase * cantonalFraction,
      },
    ]

    const muni = bfsNumber != null ? municipalities.find((m) => m.bfsNumber === bfsNumber) : undefined
    if (muni) {
      const muniFraction = muni.municipalMultiplierPercent / 100
      components.push({
        label: municipalTaxLabel(muni.name),
        baseTax: cantonalBase,
        multiplier: muniFraction,
        amount: cantonalBase * muniFraction,
      })

      const churchBase =
        taxFromBrackets(taxableIncome, data.churchIncomeTax) + taxFromBrackets(input.wealth, data.churchWealthTax)
      for (const part of churchSplitParts(input)) {
        const churchPercent =
          part.faith === 'reformed' ? data.churchMultiplierReformedPercent : muni.churchMultiplierCatholicPercent
        if (!churchPercent) continue
        const churchFraction = churchPercent / 100
        const partBase = churchBase * part.fraction
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
