import type { Faith, TaxInput } from '../../types'

export interface ChurchSplitPart {
  faith: Exclude<Faith, 'none'>
  /** Fraction of the shared church-tax base attributable to this person —
   * 1 for a single filer, 0.5 for each spouse in a married couple. */
  fraction: number
  /** Set only when married, to label which spouse this part belongs to. */
  owner?: 'you' | 'spouse'
}

/**
 * Confirmed via the Swiss Federal Tax Administration's official overview
 * ("Kirchensteuern", ESTV, Jan 2022, §5.2.3 "Gemischte Ehen"): when spouses
 * belong to different confessions, or only one belongs to a state-recognized
 * church, essentially every canton splits church tax 50/50 between the two
 * spouses' own confessions rather than applying one shared household faith —
 * a spouse with no confession simply contributes nothing (Art. 15 BV/
 * religious freedom prohibits taxing someone for a church they don't belong
 * to). Cantons phrase this in one of a few mathematically identical ways
 * (half the RATE on the full base — ZH/BS/AR/TG/TI/VS/GE; the full rate on
 * HALF the base/tax owed — BE/AI/JU; half the INCOME taxed at each rate —
 * GR): since church tax in every canton modeled here is a simple percentage
 * of an already-computed base (never itself progressive), these are always
 * equivalent, so this helper always halves the base.
 *
 * SIMPLIFICATION (documented, consistent with this project's existing
 * deduction-simplification scope — see project memory): a subset of cantons
 * (LU, UR, SZ, OW, NW, ZG, AG, NE per the ESTV doc) re-weight the split when
 * the couple has children, based on the CHILDREN'S OWN confession (this app
 * only tracks a headcount, not each child's faith) — similarly FR/SO/BL/SH
 * split into thirds with children present, the last third by the children's
 * confession. This app always uses the plain 50/50 spouse split regardless
 * of children, which is exact for every canton when there are no children,
 * and unconditionally exact for ZH/BS/AR/TG/TI/VS/GE/BE/AI/JU/GR/GL/SG.
 */
export function churchSplitParts(input: TaxInput): ChurchSplitPart[] {
  if (input.maritalStatus !== 'married') {
    return input.faith === 'none' ? [] : [{ faith: input.faith, fraction: 1 }]
  }
  const parts: ChurchSplitPart[] = []
  if (input.faith !== 'none') parts.push({ faith: input.faith, fraction: 0.5, owner: 'you' })
  if (input.spouseFaith !== 'none') parts.push({ faith: input.spouseFaith, fraction: 0.5, owner: 'spouse' })
  return parts
}

/** `"you, "` / `"spouse, "` / `""` — prefix for a church-tax component label,
 * e.g. `` `Church tax (${churchOwnerPrefix(part)}${part.faith})` ``. */
export function churchOwnerPrefix(part: ChurchSplitPart): string {
  return part.owner ? `${part.owner}, ` : ''
}
