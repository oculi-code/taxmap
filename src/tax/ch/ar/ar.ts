import type { TaxComponent } from '../../../types'
import { taxFromBrackets } from '../../lib/bracket'
import type { CantonTaxModule } from '../../lib/cantonModule'
import { churchOwnerPrefix, churchSplitParts } from '../../lib/churchSplit'
import data from './ar.data.json'
import municipalities from './ar.municipalities.json'

/**
 * Appenzell Ausserrhoden: 3 layers, but the Steuerfuss is a raw "Einheiten"
 * factor (applied directly, no /100), like Nidwalden/Obwalden. Genuinely
 * separate married/single bracket tables (no splitting divisor, unlike
 * Schaffhausen). The top income bracket is a real regressive tail — a flat
 * 2.60% that's LOWER than the preceding 2.90% marginal band — but verified
 * numerically continuous with the marginal schedule at the boundary, so
 * still just an ordinary final bracket entry (contrast NW, whose equivalent
 * cap does NOT reconcile exactly and needs special-case code).
 */
export const ar: CantonTaxModule = {
  computeComponents(input, taxableIncome, bfsNumber): TaxComponent[] {
    const incomeBrackets = input.maritalStatus === 'married' ? data.incomeTax.married : data.incomeTax.single
    const baseTax = taxFromBrackets(taxableIncome, incomeBrackets) + taxFromBrackets(input.wealth, data.wealthTax)

    const cantonalFraction = data.cantonalMultiplierFactor
    const components: TaxComponent[] = [
      { label: 'Cantonal tax (AR)', baseTax, multiplier: cantonalFraction, amount: baseTax * cantonalFraction },
    ]

    const muni = bfsNumber != null ? municipalities.find((m) => m.bfsNumber === bfsNumber) : undefined
    if (muni) {
      const muniFraction = muni.municipalMultiplierFactor
      components.push({
        label: `Municipal tax (${muni.name})`,
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
          label: `Church tax (${churchOwnerPrefix(part)}${part.faith})`,
          baseTax: partBase,
          multiplier: churchFactor,
          amount: partBase * churchFactor,
        })
      }
    }

    return components
  },
}
