import type { TaxComponent } from '../../../types'
import { taxFromBrackets } from '../../lib/bracket'
import type { CantonTaxModule } from '../../lib/cantonModule'
import { cantonalTaxLabel, municipalTaxLabel } from '../../lib/labels'
import data from './ne.data.json'
import municipalities from './ne.municipalities.json'

/**
 * Neuchâtel: cantonal (124%) + municipal, that's it — no church tax at all.
 * Unlike Vaud (state-funded churches), NE's church contribution is a purely
 * voluntary arrangement collected by the churches themselves outside the tax
 * system entirely, so it genuinely has no multiplier to model.
 *
 * NE's real income/wealth tax law is a continuous average-rate formula (rate
 * looked up for income/0.52, applied to the whole amount) rather than
 * discrete brackets — both bracket tables here are already a pre-derived
 * piecewise-linear equivalent (including the married scaling), so no special
 * formula logic is needed in this module; taxFromBrackets applies directly.
 */
export const ne: CantonTaxModule = {
  computeComponents(input, taxableIncome, bfsNumber): TaxComponent[] {
    const incomeBrackets = input.maritalStatus === 'married' ? data.incomeTax.married : data.incomeTax.single
    const wealthBrackets = input.maritalStatus === 'married' ? data.wealthTax.married : data.wealthTax.single
    const baseTax = taxFromBrackets(taxableIncome, incomeBrackets) + taxFromBrackets(input.wealth, wealthBrackets)

    const cantonalFraction = data.cantonalMultiplierPercent / 100
    const components: TaxComponent[] = [
      { label: cantonalTaxLabel('NE'), baseTax, multiplier: cantonalFraction, amount: baseTax * cantonalFraction },
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
