import type { TaxComponent } from '../../../types'
import { taxFromBrackets } from '../../lib/bracket'
import type { CantonTaxModule } from '../../lib/cantonModule'
import { churchSplitParts } from '../../lib/churchSplit'
import { cantonalTaxLabel, churchTaxLabel, municipalTaxLabel } from '../../lib/labels'
import data from './zh.data.json'
import municipalities from './zh.municipalities.json'

/**
 * Zürich: 3 layers, all expressed as a percent of the same "einfache Steuer"
 * base — cantonal (§35/§47 StG), municipal (Gemeindesteuerfuss), church
 * (Kirchgemeinde). Income and wealth tax each have their own single/married
 * bracket schedules (unlike most cantons, ZH doesn't share one wealth table).
 */
export const zh: CantonTaxModule = {
  computeComponents(input, taxableIncome, bfsNumber): TaxComponent[] {
    const incomeBrackets = input.maritalStatus === 'married' ? data.incomeTax.married : data.incomeTax.single
    const wealthBrackets = input.maritalStatus === 'married' ? data.wealthTax.married : data.wealthTax.single
    const baseTax = taxFromBrackets(taxableIncome, incomeBrackets) + taxFromBrackets(input.wealth, wealthBrackets)

    const cantonalFraction = data.cantonalMultiplierPercent / 100
    const components: TaxComponent[] = [
      { label: cantonalTaxLabel('ZH'), baseTax, multiplier: cantonalFraction, amount: baseTax * cantonalFraction },
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

      for (const part of churchSplitParts(input)) {
        const churchPercent =
          part.faith === 'reformed' ? muni.churchMultiplierReformedPercent : muni.churchMultiplierCatholicPercent
        if (!churchPercent) continue
        const churchFraction = churchPercent / 100
        const partBase = baseTax * part.fraction
        components.push({
          label: churchTaxLabel(part),
          baseTax: partBase,
          multiplier: churchFraction,
          amount: partBase * churchFraction,
        })
      }
    }

    return components
  },
}
