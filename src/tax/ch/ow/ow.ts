import type { TaxComponent } from '../../../types'
import { taxFromBrackets } from '../../lib/bracket'
import type { CantonTaxModule } from '../../lib/cantonModule'
import { churchSplitParts } from '../../lib/churchSplit'
import { cantonalTaxLabel, churchTaxLabel, municipalTaxLabel } from '../../lib/labels'
import data from './ow.data.json'
import municipalities from './ow.municipalities.json'

/**
 * Obwalden: genuinely flat-rate (no brackets) — 1.8% income / 0.2‰ wealth —
 * like Uri, but the Steuerfuss is expressed in raw "Einheiten" (a factor
 * applied directly, e.g. 3.25 means 325%) rather than a percent. Several
 * municipalities stack an earmarked special-purpose levy directly into their
 * headline figure (already folded into ow.municipalities.json's
 * municipalMultiplierFactor by the source data). Reformed church is a flat
 * 0.54 canton-wide EXCEPT Engelberg, which sits outside the cantonal
 * Reformed Kirchgemeinde and genuinely has no church-tax line at all (both
 * fields null in the data — confirmed zero, not a research gap, so the
 * fraction lookup below correctly falls through and skips the component).
 */
export const ow: CantonTaxModule = {
  computeComponents(input, taxableIncome, bfsNumber): TaxComponent[] {
    const baseTax = taxFromBrackets(taxableIncome, data.incomeTax) + taxFromBrackets(input.wealth, data.wealthTax)
    const cantonalFraction = data.cantonalMultiplierFactor
    const components: TaxComponent[] = [
      { label: cantonalTaxLabel('OW'), baseTax, multiplier: cantonalFraction, amount: baseTax * cantonalFraction },
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
          part.faith === 'reformed' ? muni.churchMultiplierReformedFactor : muni.churchMultiplierCatholicFactor
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
