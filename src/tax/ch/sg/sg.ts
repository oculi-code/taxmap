import { t } from '../../../i18n/translations'
import type { TaxComponent } from '../../../types'
import { taxFromBrackets } from '../../lib/bracket'
import type { CantonTaxModule } from '../../lib/cantonModule'
import { churchSplitParts } from '../../lib/churchSplit'
import { cantonalTaxLabel, churchTaxLabel, municipalTaxLabel } from '../../lib/labels'
import data from './sg.data.json'
import municipalities from './sg.municipalities.json'

/**
 * St. Gallen: 3 layers, all percent-of-"einfache Steuer" — cantonal,
 * municipal, church. Wealth tax is a flat rate. One municipality, Wil
 * (BFS 3427), has a genuinely undecided 2026 multiplier pending a September
 * 2026 referendum — rather than showing no municipal/church tax at all
 * (which reads as a bug, not an unknown), its data row carries a reasonable
 * estimate plus an `*Estimated` flag (see sg.municipalities.json and the
 * errata in data/raw/SG.json's notes), which this module surfaces as a
 * row/banner warning via TaxComponent.warning rather than presenting it as
 * a confirmed rate.
 */
export const sg: CantonTaxModule = {
  computeComponents(input, taxableIncome, bfsNumber): TaxComponent[] {
    const incomeBrackets = input.maritalStatus === 'married' ? data.incomeTax.married : data.incomeTax.single
    const baseTax = taxFromBrackets(taxableIncome, incomeBrackets) + taxFromBrackets(input.wealth, data.wealthTax)

    const cantonalFraction = data.cantonalMultiplierPercent / 100
    const components: TaxComponent[] = [
      { label: cantonalTaxLabel('SG'), baseTax, multiplier: cantonalFraction, amount: baseTax * cantonalFraction },
    ]

    const muni = bfsNumber != null ? municipalities.find((m) => m.bfsNumber === bfsNumber) : undefined
    if (muni?.municipalMultiplierPercent != null) {
      const muniFraction = muni.municipalMultiplierPercent / 100
      components.push({
        label: municipalTaxLabel(muni.name),
        baseTax,
        multiplier: muniFraction,
        amount: baseTax * muniFraction,
        warning: muni.municipalMultiplierEstimated ? t('warningSgMunicipal', { name: muni.name }) : undefined,
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
          warning: muni.churchMultiplierEstimated ? t('warningSgChurch', { name: muni.name }) : undefined,
        })
      }
    }

    return components
  },
}
