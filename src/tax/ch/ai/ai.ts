import type { TaxComponent } from '../../../types'
import { taxFromBrackets } from '../../lib/bracket'
import type { CantonTaxModule } from '../../lib/cantonModule'
import { churchOwnerPrefix, churchSplitParts } from '../../lib/churchSplit'
import data from './ai.data.json'
import municipalities from './ai.municipalities.json'

/**
 * Appenzell Innerrhoden: standard percent-of-simple-tax cantonal + municipal
 * (the "Bezirk" — AI's lowest administrative unit and this app's
 * municipality-equivalent layer; only 5 exist since the 2022 Schwende/Rüte
 * merger) + church. Income tax has a top-end average-rate cap above CHF
 * 200'000, but unlike Nidwalden's it's exactly mathematically continuous
 * with the marginal schedule at the boundary, so no special-casing is
 * needed — the bracket table already includes it as an ordinary entry.
 * Church tax is patchy: AI has almost no in-canton Reformed infrastructure
 * (only Appenzell has a confirmed rate) and one Bezirk (Schlatt-Haslen) has
 * no confirmed catholic rate either — both left null in the data and
 * skipped gracefully rather than treated as 0.
 */
export const ai: CantonTaxModule = {
  computeComponents(input, taxableIncome, bfsNumber): TaxComponent[] {
    const incomeBrackets = input.maritalStatus === 'married' ? data.incomeTax.married : data.incomeTax.single
    const baseTax = taxFromBrackets(taxableIncome, incomeBrackets) + taxFromBrackets(input.wealth, data.wealthTax)

    const cantonalFraction = data.cantonalMultiplierPercent / 100
    const components: TaxComponent[] = [
      { label: 'Cantonal tax (AI)', baseTax, multiplier: cantonalFraction, amount: baseTax * cantonalFraction },
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

      for (const part of churchSplitParts(input)) {
        const churchPercent =
          part.faith === 'reformed' ? muni.churchMultiplierReformedPercent : muni.churchMultiplierCatholicPercent
        if (!churchPercent) continue
        const churchFraction = churchPercent / 100
        const partBase = baseTax * part.fraction
        components.push({
          label: `Church tax (${churchOwnerPrefix(part)}${part.faith})`,
          baseTax: partBase,
          multiplier: churchFraction,
          amount: partBase * churchFraction,
        })
      }
    }

    return components
  },
}
