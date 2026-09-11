import type { TaxComponent } from '../../../types'
import { taxFromBrackets } from '../../lib/bracket'
import type { CantonTaxModule } from '../../lib/cantonModule'
import { churchOwnerPrefix, churchSplitParts } from '../../lib/churchSplit'
import data from './fr.data.json'
import municipalities from './fr.municipalities.json'

/**
 * Fribourg: three independent multiplier layers apply directly to a shared
 * base (income base and wealth base each computed separately, never
 * combined into one), unlike most cantons in this project:
 *  - Cantonal: the "coefficient annuel" is set independently per tax type
 *    (96% income / 100% wealth for 2026) — two separate constants, not one
 *    shared multiplier.
 *  - Communal: legally required to be identical for income and wealth
 *    (Art. 4 al. 3 LICo), so it's one combined-base component (like BL's
 *    municipal layer).
 *  - Ecclesiastical (church/parish): has no such equality requirement and
 *    often differs substantially between income and wealth for the same
 *    parish, so it needs its own income and wealth fields/components.
 * One not-yet-tabulated 2025-merger commune (Fétigny-Ménières) uses a
 * flagged estimated municipal multiplier rather than showing no municipal
 * tax at all (see errata in data/raw/FR.json's notes); church coefficients
 * are left null and skipped wherever a commune is covered by multiple
 * parishes charging genuinely different rates, since no single defensible
 * estimate exists there without address-level parish membership data.
 */
export const fr: CantonTaxModule = {
  computeComponents(input, taxableIncome, bfsNumber): TaxComponent[] {
    const incomeBrackets = input.maritalStatus === 'married' ? data.incomeTax.married : data.incomeTax.single
    const incomeBase = taxFromBrackets(taxableIncome, incomeBrackets)
    const wealthBase = taxFromBrackets(input.wealth, data.wealthTax)

    const cantonalIncomeFraction = data.cantonalIncomeMultiplierPercent / 100
    const cantonalWealthFraction = data.cantonalWealthMultiplierPercent / 100
    const components: TaxComponent[] = [
      {
        label: 'Cantonal income tax (FR)',
        baseTax: incomeBase,
        multiplier: cantonalIncomeFraction,
        amount: incomeBase * cantonalIncomeFraction,
      },
      {
        label: 'Cantonal wealth tax (FR)',
        baseTax: wealthBase,
        multiplier: cantonalWealthFraction,
        amount: wealthBase * cantonalWealthFraction,
      },
    ]

    const muni = bfsNumber != null ? municipalities.find((m) => m.bfsNumber === bfsNumber) : undefined
    if (muni?.municipalMultiplierPercent != null) {
      const muniFraction = muni.municipalMultiplierPercent / 100
      const combinedBase = incomeBase + wealthBase
      components.push({
        label: `Municipal tax (${muni.name})`,
        baseTax: combinedBase,
        multiplier: muniFraction,
        amount: combinedBase * muniFraction,
        warning: muni.municipalMultiplierEstimated
          ? `${muni.name} was formed by a 2025 merger and isn't in the canton's published 2026 commune-coefficient dataset yet — this uses an estimate (the average of its two predecessor communes' last known rates).`
          : undefined,
      })
    }

    if (muni) {
      for (const part of churchSplitParts(input)) {
        const incomePercent =
          part.faith === 'reformed' ? muni.churchMultiplierReformedPercent : muni.churchMultiplierCatholicPercent
        const wealthPercent =
          part.faith === 'reformed'
            ? muni.churchMultiplierReformedWealthPercent
            : muni.churchMultiplierCatholicWealthPercent

        if (incomePercent != null) {
          const f = incomePercent / 100
          const partBase = incomeBase * part.fraction
          components.push({
            label: `Church income tax (${churchOwnerPrefix(part)}${part.faith})`,
            baseTax: partBase,
            multiplier: f,
            amount: partBase * f,
          })
        }
        if (wealthPercent != null) {
          const f = wealthPercent / 100
          const partBase = wealthBase * part.fraction
          components.push({
            label: `Church wealth tax (${churchOwnerPrefix(part)}${part.faith})`,
            baseTax: partBase,
            multiplier: f,
            amount: partBase * f,
          })
        }
      }
    }

    return components
  },
}
