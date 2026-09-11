import type { TaxComponent } from '../../../types'
import { scaleBracketsForSplitting, taxFromBrackets } from '../../lib/bracket'
import type { CantonTaxModule } from '../../lib/cantonModule'
import { churchOwnerPrefix, churchSplitParts } from '../../lib/churchSplit'
import data from './sz.data.json'
import municipalities from './sz.municipalities.json'

/**
 * Schwyz: genuinely 4 layers — Kanton + Bezirk (district) + Gemeinde
 * (municipality) + Kirchgemeinde (church) — each its own percent-of-"einfache
 * Steuer" multiplier, all summed independently rather than compounded. Three
 * districts (Einsiedeln, Gersau, Küssnacht) have no separate municipal layer
 * distinct from the district itself, so `municipalMultiplierPercent` is 0
 * there and only the district line is shown.
 *
 * SZ has no separately-published married tariff at all — § 36 Abs. 2 StG
 * instead uses a rate-determining divisor (1.9): look up the average rate
 * for income/1.9 on the single schedule, then apply it to the full income.
 * That's mathematically equivalent to scaling every single-schedule
 * threshold by the divisor (see scaleBracketsForSplitting), so married
 * brackets are derived here rather than stored.
 *
 * Quirk: §36a StG applies a harsher surcharge schedule above CHF 258'800,
 * but ONLY to the cantonal component — district/municipal/church still use
 * the plain schedule. The canton only publishes this for single filers; the
 * married version used here is this project's own extension of the same §36
 * Abs. 2 divisor to §36a (a direct mathematical consequence of the official
 * mechanism, not an independently-published married-specific text — see the
 * errata in data/raw/SZ.json's notes).
 */
export const sz: CantonTaxModule = {
  computeComponents(input, taxableIncome, bfsNumber): TaxComponent[] {
    const married = input.maritalStatus === 'married'
    const incomeBrackets = married
      ? scaleBracketsForSplitting(data.incomeTaxSingle, data.splittingDivisor)
      : data.incomeTaxSingle
    const wealthTax = taxFromBrackets(input.wealth, data.wealthTax)
    const baseTax = taxFromBrackets(taxableIncome, incomeBrackets) + wealthTax

    const cantonalIncomeBrackets = married
      ? scaleBracketsForSplitting(data.cantonalOnlyIncomeTaxSingle, data.splittingDivisor)
      : data.cantonalOnlyIncomeTaxSingle
    const cantonalBaseTax = taxFromBrackets(taxableIncome, cantonalIncomeBrackets) + wealthTax
    const cantonalFraction = data.cantonalMultiplierPercent / 100
    const components: TaxComponent[] = [
      {
        label: 'Cantonal tax (SZ)',
        baseTax: cantonalBaseTax,
        multiplier: cantonalFraction,
        amount: cantonalBaseTax * cantonalFraction,
      },
    ]

    const muni = bfsNumber != null ? municipalities.find((m) => m.bfsNumber === bfsNumber) : undefined
    if (muni) {
      const districtFraction = muni.districtMultiplierPercent / 100
      components.push({
        label: `District tax (${muni.district})`,
        baseTax,
        multiplier: districtFraction,
        amount: baseTax * districtFraction,
      })

      if (muni.municipalMultiplierPercent > 0) {
        const muniFraction = muni.municipalMultiplierPercent / 100
        components.push({
          label: `Municipal tax (${muni.name})`,
          baseTax,
          multiplier: muniFraction,
          amount: baseTax * muniFraction,
        })
      }

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
