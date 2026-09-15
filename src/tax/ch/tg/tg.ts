import type { TaxComponent } from '../../../types'
import { taxFromBrackets } from '../../lib/bracket'
import type { CantonTaxModule } from '../../lib/cantonModule'
import { churchSplitParts } from '../../lib/churchSplit'
import { cantonalTaxLabel, churchTaxLabel, municipalTaxInclSchoolLabel } from '../../lib/labels'
import data from './tg.data.json'
import municipalities from './tg.municipalities.json'

/**
 * Thurgau: nominally 4 layers (Staat + Gemeinde + Schule + Kirche) — but
 * Schulgemeinde boundaries often split a single political municipality in
 * ways that don't cleanly map to one number per row, so Gemeinde+Schule are
 * pre-combined into one municipalMultiplier figure (see tg.data.json /
 * migrate-tax-data.mjs; same pragmatic choice as Solothurn, unlike Schwyz
 * where the district split was clean enough to model as its own layer).
 * Wealth tax is a flat rate.
 */
export const tg: CantonTaxModule = {
  computeComponents(input, taxableIncome, bfsNumber): TaxComponent[] {
    const incomeBrackets = input.maritalStatus === 'married' ? data.incomeTax.married : data.incomeTax.single
    const baseTax = taxFromBrackets(taxableIncome, incomeBrackets) + taxFromBrackets(input.wealth, data.wealthTax)

    const cantonalFraction = data.cantonalMultiplierPercent / 100
    const components: TaxComponent[] = [
      { label: cantonalTaxLabel('TG'), baseTax, multiplier: cantonalFraction, amount: baseTax * cantonalFraction },
    ]

    const muni = bfsNumber != null ? municipalities.find((m) => m.bfsNumber === bfsNumber) : undefined
    if (muni) {
      const muniFraction = muni.municipalMultiplierPercent / 100
      components.push({
        label: municipalTaxInclSchoolLabel(muni.name),
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
