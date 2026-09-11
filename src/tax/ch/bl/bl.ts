import type { TaxComponent } from '../../../types'
import { taxFromBrackets } from '../../lib/bracket'
import type { CantonTaxModule } from '../../lib/cantonModule'
import data from './bl.data.json'
import municipalities from './bl.municipalities.json'

/**
 * Basel-Landschaft: the cantonal multiplier (a Landrat-adjustable 95-105%
 * band, currently 100%) applies to INCOME tax only — wealth tax has no
 * equivalent cantonal multiplier step at all, its bracket result is final
 * (i.e. always effectively "100%", not a configurable figure). The
 * municipal layer, by contrast, is one combined Steuerfuss applied
 * identically to both income and wealth base (unlike Basel-Stadt's
 * Riehen/Bettingen, which split it). No confirmed church data — BL's
 * per-Kirchgemeinde rates aren't published in any consolidated dataset.
 */
export const bl: CantonTaxModule = {
  computeComponents(input, taxableIncome, bfsNumber): TaxComponent[] {
    const incomeBrackets = input.maritalStatus === 'married' ? data.incomeTax.married : data.incomeTax.single
    const incomeBase = taxFromBrackets(taxableIncome, incomeBrackets)
    const wealthBase = taxFromBrackets(input.wealth, data.wealthTax)

    const cantonalIncomeFraction = data.cantonalIncomeMultiplierPercent / 100
    const components: TaxComponent[] = [
      {
        label: 'Cantonal income tax (BL)',
        baseTax: incomeBase,
        multiplier: cantonalIncomeFraction,
        amount: incomeBase * cantonalIncomeFraction,
      },
      { label: 'Cantonal wealth tax (BL)', baseTax: wealthBase, multiplier: null, amount: wealthBase },
    ]

    const muni = bfsNumber != null ? municipalities.find((m) => m.bfsNumber === bfsNumber) : undefined
    if (muni) {
      const muniFraction = muni.municipalMultiplierPercent / 100
      const combinedBase = incomeBase + wealthBase
      components.push({
        label: `Municipal tax (${muni.name})`,
        baseTax: combinedBase,
        multiplier: muniFraction,
        amount: combinedBase * muniFraction,
      })
    }

    return components
  },
}
