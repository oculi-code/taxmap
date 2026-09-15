import type { TaxComponent } from '../../../types'
import { taxFromBrackets } from '../../lib/bracket'
import type { CantonTaxModule } from '../../lib/cantonModule'
import { cantonalTaxLabel, municipalTaxLabel } from '../../lib/labels'
import data from './vd.data.json'
import municipalities from './vd.municipalities.json'

/**
 * Vaud: cantonal (155%) and communal multipliers apply independently to the
 * same base tax — but a fiscal-year-2026-specific rebate (Art. 4 LRIPP)
 * reduces the CANTONAL share only, by 5%; the communal share is computed off
 * the undiscounted base. No church tax at all — Vaud funds its recognized
 * churches from general revenue, so faith has no effect on the bill here.
 *
 * Simplification: married status uses the "quotient familial" base scaling
 * (1.0 part single, 1.8 parts spouses — same technique as GR/SZ's divisor),
 * but NOT the additional +0.5-part-per-child adjustment or its CHF 212'900
 * cap (Art. 43 LI) — a real gap for parents, consistent with this project's
 * existing simplification of not modeling every canton's own child-related
 * rate/deduction mechanics.
 */
export const vd: CantonTaxModule = {
  computeComponents(input, taxableIncome, bfsNumber): TaxComponent[] {
    const incomeBrackets = input.maritalStatus === 'married' ? data.incomeTax.married : data.incomeTax.single
    const baseTax = taxFromBrackets(taxableIncome, incomeBrackets) + taxFromBrackets(input.wealth, data.wealthTax)

    const cantonalFraction = (data.cantonalMultiplierPercent / 100) * (1 - data.cantonalOnlyRebatePercent / 100)
    const components: TaxComponent[] = [
      { label: cantonalTaxLabel('VD'), baseTax, multiplier: cantonalFraction, amount: baseTax * cantonalFraction },
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
    }

    return components
  },
}
