import type { TaxComponent, TaxInput } from '../../types'

/**
 * Contract every precisely-modeled canton implements. Each canton owns its
 * own layering (how many levels of government tax it, in what order, on
 * what base) and its own quirks — nothing here forces a canton's mechanism
 * to fit a generic shape. `taxableIncome` is the one thing shared with every
 * canton: it's computed once by the federal calculation (see ../ch/federal.ts)
 * and handed down, since deduction rules aren't modeled per-canton (see
 * project docs) — only the tax *rates* are canton-specific.
 */
export interface CantonTaxModule {
  /** Cantonal/district/municipal/church tax components for this household,
   * given the shared taxable income and (if a municipality was picked) its
   * BFS number for looking up that municipality's own multipliers. */
  computeComponents(input: TaxInput, taxableIncome: number, bfsNumber: number | null): TaxComponent[]
}
