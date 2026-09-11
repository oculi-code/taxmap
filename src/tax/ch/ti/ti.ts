import type { TaxComponent } from '../../../types'
import { taxFromBrackets } from '../../lib/bracket'
import type { CantonTaxModule } from '../../lib/cantonModule'
import data from './ti.data.json'
import municipalities from './ti.municipalities.json'

/**
 * Ticino: 2 layers — cantonal (currently 100%, effectively pass-through, but
 * still a real independently-set multiplier, not baked into the brackets)
 * plus municipal. No church tax modeled: TI's "imposta di culto" is levied
 * per-parish rather than per-municipality, and highly heterogeneous (most
 * parishes don't levy it at all) — no canton-wide table exists to model.
 * Both bracket tables have genuine non-monotonic marginal-rate humps
 * (verified against the source, not transcription errors) — no special
 * handling needed, since taxFromBrackets already computes correct
 * non-decreasing cumulative tax as long as every rate stays ≥ 0.
 */
export const ti: CantonTaxModule = {
  computeComponents(input, taxableIncome, bfsNumber): TaxComponent[] {
    const incomeBrackets = input.maritalStatus === 'married' ? data.incomeTax.married : data.incomeTax.single
    const baseTax = taxFromBrackets(taxableIncome, incomeBrackets) + taxFromBrackets(input.wealth, data.wealthTax)

    const cantonalFraction = data.cantonalMultiplierPercent / 100
    const components: TaxComponent[] = [
      { label: 'Cantonal tax (TI)', baseTax, multiplier: cantonalFraction, amount: baseTax * cantonalFraction },
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
