import type { TaxComponent } from '../../../types'
import { taxFromBrackets } from '../../lib/bracket'
import type { CantonTaxModule } from '../../lib/cantonModule'
import { cantonalIncomeTaxLabel, cantonalWealthTaxLabel, municipalTaxLabel, supplementaryWealthTaxLabel } from '../../lib/labels'
import data from './ge.data.json'
import municipalities from './ge.municipalities.json'

/**
 * Geneva: the richest quirk set modeled in this project so far.
 *
 * - The 148.5% cantonal multiplier ("centimes additionnels cantonaux")
 *   applies to both income and wealth tax — but a further 12% rebate
 *   (Art. 1 LDIRPP) applies ONLY to the cantonal INCOME share, never wealth,
 *   and never the municipal share (which is computed on the undiscounted
 *   base). So income and wealth need genuinely separate cantonal components,
 *   unlike every percent-multiplier canton modeled so far where one combined
 *   line suffices. The municipal share, by contrast, uses the SAME rate on
 *   both bases (no such asymmetry there), so it stays one combined line.
 * - Wealth tax has a second, independent bracket layer ("impôt
 *   supplémentaire sur la fortune", Art. 59 al. 2 LIPP) that NO multiplier
 *   — cantonal or municipal — applies to at all; it's added flat.
 * - No church tax: Geneva's 2018 laïcité law bars any compulsory church-tax
 *   multiplier (a voluntary, unenforceable "contribution religieuse" exists
 *   but is billed entirely separately from the tax bill — not modeled).
 * - The "married" bracket table (Genevan splitting: average rate at half
 *   income, applied to the full amount) also legally covers single
 *   taxpayers maintaining a household with dependent children, per Art. 41
 *   al. 3 LIPP — mirrored here the same way the federal Elterntarif works.
 */
export const ge: CantonTaxModule = {
  computeComponents(input, taxableIncome, bfsNumber): TaxComponent[] {
    const usesSplitTariff = input.maritalStatus === 'married' || input.numberOfChildren > 0
    const incomeBrackets = usesSplitTariff ? data.incomeTax.married : data.incomeTax.single
    const incomeBase = taxFromBrackets(taxableIncome, incomeBrackets)
    const wealthBase = taxFromBrackets(input.wealth, data.wealthTax)
    const supplementaryWealthTax = taxFromBrackets(input.wealth, data.wealthTaxSupplementary)

    const cantonalFraction = data.cantonalMultiplierPercent / 100
    const cantonalIncomeFraction = cantonalFraction * (1 - data.cantonalIncomeRebatePercent / 100)

    const components: TaxComponent[] = [
      {
        label: cantonalIncomeTaxLabel('GE'),
        baseTax: incomeBase,
        multiplier: cantonalIncomeFraction,
        amount: incomeBase * cantonalIncomeFraction,
      },
      {
        label: cantonalWealthTaxLabel('GE'),
        baseTax: wealthBase,
        multiplier: cantonalFraction,
        amount: wealthBase * cantonalFraction,
      },
    ]

    const muni = bfsNumber != null ? municipalities.find((m) => m.bfsNumber === bfsNumber) : undefined
    if (muni) {
      const muniFraction = muni.municipalMultiplierPercent / 100
      const combinedBase = incomeBase + wealthBase
      components.push({
        label: municipalTaxLabel(muni.name),
        baseTax: combinedBase,
        multiplier: muniFraction,
        amount: combinedBase * muniFraction,
      })
    }

    components.push({
      label: supplementaryWealthTaxLabel('GE'),
      baseTax: input.wealth,
      multiplier: null,
      amount: supplementaryWealthTax,
    })

    return components
  },
}
