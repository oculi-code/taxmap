import type { TaxComponent } from '../../../types'
import { taxFromBrackets } from '../../lib/bracket'
import type { CantonTaxModule } from '../../lib/cantonModule'
import { cantonalTaxLabel, municipalTaxLabel } from '../../lib/labels'
import data from './vs.data.json'
import municipalities from './vs.municipalities.json'

/**
 * Valais: unlike every other modeled canton, there is NO separate cantonal
 * multiplier — the bracket table already produces the full cantonal tax
 * owed. Communes instead apply their own coefficient as a direct factor
 * (1.00–1.50) to that same amount. No structured church-tax data exists for
 * VS (it's an optional, per-commune levy raised via the general budget, not
 * a distinct canton-wide or per-parish rate) — not modeled.
 */
export const vs: CantonTaxModule = {
  computeComponents(input, taxableIncome, bfsNumber): TaxComponent[] {
    const incomeBrackets = input.maritalStatus === 'married' ? data.incomeTax.married : data.incomeTax.single
    const baseTax = taxFromBrackets(taxableIncome, incomeBrackets) + taxFromBrackets(input.wealth, data.wealthTax)

    const components: TaxComponent[] = [{ label: cantonalTaxLabel('VS'), baseTax, multiplier: null, amount: baseTax }]

    const muni = bfsNumber != null ? municipalities.find((m) => m.bfsNumber === bfsNumber) : undefined
    if (muni) {
      const factor = muni.municipalMultiplierFactor
      components.push({ label: municipalTaxLabel(muni.name), baseTax, multiplier: factor, amount: baseTax * factor })
    }

    return components
  },
}
