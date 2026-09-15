import { t } from '../../../i18n/translations'
import type { TaxComponent } from '../../../types'
import { taxFromBrackets } from '../../lib/bracket'
import type { CantonTaxModule } from '../../lib/cantonModule'
import { churchSplitParts } from '../../lib/churchSplit'
import { cantonalTaxLabel, churchTaxLabel, municipalTaxLabel } from '../../lib/labels'
import data from './ju.data.json'
import municipalities from './ju.municipalities.json'

/**
 * Jura: cantonal multiplier is a direct factor (2.85×), not a percent.
 * Wealth has a cliff-style exemption — below the threshold it's entirely
 * untaxed, at/above it the FULL amount is taxed from zero (not just the
 * excess). Quirk: church tax is levied as a percentage of the cantonal tax
 * ALREADY DUE (i.e. after the 2.85× multiplier), not of the simple/base tax
 * like every other modeled canton — that's why its base below is
 * `cantonalAmount`, not `baseTax`. Moutier (BFS 6831) transferred into JU
 * from Bern in 2026 and has no researched municipal/church data yet — its
 * row uses a reasonable estimate flagged via `*Estimated` (see errata in
 * data/raw/JU.json's notes), surfaced here as a row/banner warning.
 */
export const ju: CantonTaxModule = {
  computeComponents(input, taxableIncome, bfsNumber): TaxComponent[] {
    const incomeBrackets = input.maritalStatus === 'married' ? data.incomeTax.married : data.incomeTax.single
    const wealthTax = input.wealth < data.wealthExemptionThreshold ? 0 : taxFromBrackets(input.wealth, data.wealthTax)
    const baseTax = taxFromBrackets(taxableIncome, incomeBrackets) + wealthTax

    const cantonalAmount = baseTax * data.cantonalMultiplierFactor
    const components: TaxComponent[] = [
      { label: cantonalTaxLabel('JU'), baseTax, multiplier: data.cantonalMultiplierFactor, amount: cantonalAmount },
    ]

    const muni = bfsNumber != null ? municipalities.find((m) => m.bfsNumber === bfsNumber) : undefined
    if (muni) {
      const muniFactor = muni.municipalMultiplierFactor
      components.push({
        label: municipalTaxLabel(muni.name),
        baseTax,
        multiplier: muniFactor,
        amount: baseTax * muniFactor,
        warning: muni.municipalMultiplierEstimated ? t('warningJuMunicipal', { name: muni.name }) : undefined,
      })

      for (const part of churchSplitParts(input)) {
        const churchRate =
          part.faith === 'reformed'
            ? (muni.churchMultiplierReformedRate ?? data.churchReformedRate)
            : muni.churchMultiplierCatholicRate
        if (!churchRate) continue
        const partBase = cantonalAmount * part.fraction
        components.push({
          label: churchTaxLabel(part),
          baseTax: partBase,
          multiplier: churchRate,
          amount: partBase * churchRate,
          warning:
            part.faith === 'catholic' && muni.churchMultiplierCatholicEstimated
              ? t('warningJuChurch', { name: muni.name })
              : undefined,
        })
      }
    }

    return components
  },
}
