import type { TaxComponent } from '../../../types'
import { taxFromBrackets } from '../../lib/bracket'
import type { CantonTaxModule } from '../../lib/cantonModule'
import { churchOwnerPrefix, churchSplitParts } from '../../lib/churchSplit'
import data from './bs.data.json'
import municipalities from './bs.municipalities.json'

/**
 * Basel-Stadt: unlike every other canton modeled here, there is no canton-
 * wide multiplier at all — the bracket table's result IS the tax, and the
 * cantonal/municipal SPLIT itself varies by municipality:
 *  - Basel (the city, ~91% of the population): 100% cantonal, 0% municipal —
 *    no municipal tax layer exists there at all.
 *  - Riehen and Bettingen: the canton takes a fixed 50% "Kantonssteuerquote"
 *    of the bracket amount, and each commune sets its OWN municipal rate
 *    separately for income vs. wealth tax (they differ) — so their combined
 *    rate (87.5-96%) is actually lower than Basel's flat 100%.
 * Both shares therefore come from the per-municipality data, not a shared
 * cantonal constant. Church tax (one Kirchgemeinde per confession,
 * canton-wide) applies to income tax only, never wealth. Wealth tax has its
 * own single/married bracket split (no shared "general" schedule, unlike
 * most cantons).
 */
export const bs: CantonTaxModule = {
  computeComponents(input, taxableIncome, bfsNumber): TaxComponent[] {
    const incomeBrackets = input.maritalStatus === 'married' ? data.incomeTax.married : data.incomeTax.single
    const wealthBrackets = input.maritalStatus === 'married' ? data.wealthTax.married : data.wealthTax.single
    const incomeBase = taxFromBrackets(taxableIncome, incomeBrackets)
    const wealthBase = taxFromBrackets(input.wealth, wealthBrackets)

    const muni = bfsNumber != null ? municipalities.find((m) => m.bfsNumber === bfsNumber) : undefined
    // Default to Basel's own split if no municipality resolved (shouldn't
    // normally happen — BS has only these 3 municipalities, all covered).
    const cantonalIncomeFraction = (muni?.cantonalShareIncomePercent ?? 100) / 100
    const cantonalWealthFraction = (muni?.cantonalShareWealthPercent ?? 100) / 100
    const municipalIncomeFraction = (muni?.municipalShareIncomePercent ?? 0) / 100
    const municipalWealthFraction = (muni?.municipalShareWealthPercent ?? 0) / 100

    const components: TaxComponent[] = [
      {
        label: 'Cantonal income tax (BS)',
        baseTax: incomeBase,
        multiplier: cantonalIncomeFraction,
        amount: incomeBase * cantonalIncomeFraction,
      },
      {
        label: 'Cantonal wealth tax (BS)',
        baseTax: wealthBase,
        multiplier: cantonalWealthFraction,
        amount: wealthBase * cantonalWealthFraction,
      },
    ]

    if (muni && (municipalIncomeFraction > 0 || municipalWealthFraction > 0)) {
      components.push({
        label: `Municipal income tax (${muni.name})`,
        baseTax: incomeBase,
        multiplier: municipalIncomeFraction,
        amount: incomeBase * municipalIncomeFraction,
      })
      components.push({
        label: `Municipal wealth tax (${muni.name})`,
        baseTax: wealthBase,
        multiplier: municipalWealthFraction,
        amount: wealthBase * municipalWealthFraction,
      })
    }

    if (muni) {
      for (const part of churchSplitParts(input)) {
        const churchPercent =
          part.faith === 'reformed' ? muni.churchMultiplierReformedPercent : muni.churchMultiplierCatholicPercent
        if (!churchPercent) continue
        const churchFraction = churchPercent / 100
        const partBase = incomeBase * part.fraction
        components.push({
          label: `Church tax (${churchOwnerPrefix(part)}${part.faith}, income only)`,
          baseTax: partBase,
          multiplier: churchFraction,
          amount: partBase * churchFraction,
        })
      }
    }

    return components
  },
}
