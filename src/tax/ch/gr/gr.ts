import type { TaxComponent } from '../../../types'
import { taxFromBrackets } from '../../lib/bracket'
import type { CantonTaxModule } from '../../lib/cantonModule'
import { churchSplitParts } from '../../lib/churchSplit'
import { cantonalTaxLabel, churchTaxLabel, churchTaxReformedLandeskircheLabel, municipalTaxLabel } from '../../lib/labels'
import data from './gr.data.json'
import municipalities from './gr.municipalities.json'

/**
 * Graubünden: 3 layers, all percent-of-"einfache Steuer" — cantonal
 * (Art. 39/64 StG), municipal, church. One shared wealth-tax schedule (no
 * single/married split). Both bracket tables end in a flat average-rate
 * bracket that's numerically identical to continuing the marginal sum (the
 * flat rate is defined as the average rate at that exact threshold), so no
 * special-casing is needed — taxFromBrackets already handles it correctly.
 *
 * Quirk: the Reformed church (Evangelische Landeskirche) charges a uniform
 * 3.5% cantonal layer ON TOP OF each municipality's own local parish rate —
 * two additive percentages, not one. Catholic has no such cantonal layer.
 */
export const gr: CantonTaxModule = {
  computeComponents(input, taxableIncome, bfsNumber): TaxComponent[] {
    const incomeBrackets = input.maritalStatus === 'married' ? data.incomeTax.married : data.incomeTax.single
    const baseTax = taxFromBrackets(taxableIncome, incomeBrackets) + taxFromBrackets(input.wealth, data.wealthTax)

    const cantonalFraction = data.cantonalMultiplierPercent / 100
    const components: TaxComponent[] = [
      { label: cantonalTaxLabel('GR'), baseTax, multiplier: cantonalFraction, amount: baseTax * cantonalFraction },
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
        const partBase = baseTax * part.fraction
        if (part.faith === 'reformed') {
          const churchPercent = muni.churchMultiplierReformedLocalPercent
          if (churchPercent == null) continue
          const churchFraction = (churchPercent + data.churchReformedCantonalPercent) / 100
          components.push({
            label: churchTaxReformedLandeskircheLabel(part),
            baseTax: partBase,
            multiplier: churchFraction,
            amount: partBase * churchFraction,
          })
        } else if (muni.churchMultiplierCatholicPercent) {
          const churchFraction = muni.churchMultiplierCatholicPercent / 100
          components.push({
            label: churchTaxLabel(part),
            baseTax: partBase,
            multiplier: churchFraction,
            amount: partBase * churchFraction,
          })
        }
      }
    }

    return components
  },
}
