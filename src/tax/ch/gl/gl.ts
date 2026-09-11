import type { TaxComponent } from '../../../types'
import { taxFromBrackets } from '../../lib/bracket'
import type { CantonTaxModule } from '../../lib/cantonModule'
import data from './gl.data.json'
import municipalities from './gl.municipalities.json'

/**
 * Glarus: cantonal + municipal only. The cantonal multiplier folds in the
 * earmarked "Bausteuerzuschlag" infrastructure surcharge (58% ordinary +
 * 1.7%), which is billed identically to the ordinary Steuerfuss as a percent
 * of simple tax — see gl.data.json. Wealth tax is a genuine flat rate (one
 * bracket). No church tax modeled: Glarus's ~10 Reformed parishes don't
 * align with its 3 merged political municipalities, so a single per-
 * municipality figure can't correctly represent it, and the canton's own
 * comparison source was unreachable at data-gathering time.
 */
export const gl: CantonTaxModule = {
  computeComponents(input, taxableIncome, bfsNumber): TaxComponent[] {
    const incomeBrackets = input.maritalStatus === 'married' ? data.incomeTax.married : data.incomeTax.single
    const baseTax = taxFromBrackets(taxableIncome, incomeBrackets) + taxFromBrackets(input.wealth, data.wealthTax)

    const cantonalFraction = data.cantonalMultiplierPercent / 100
    const components: TaxComponent[] = [
      { label: 'Cantonal tax (GL)', baseTax, multiplier: cantonalFraction, amount: baseTax * cantonalFraction },
    ]

    const muni = bfsNumber != null ? municipalities.find((m) => m.bfsNumber === bfsNumber) : undefined
    if (muni) {
      const muniFraction = muni.municipalMultiplierPercent / 100
      components.push({
        label: `Municipal tax (${muni.name})`,
        baseTax,
        multiplier: muniFraction,
        amount: baseTax * muniFraction,
      })
    }

    return components
  },
}
