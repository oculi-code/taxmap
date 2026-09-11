import type { Bracket } from './types'

/** Progressive tax on `amount` given marginal-rate breakpoints. Each bracket's
 * `rate` applies to the slice from its `from` up to the next bracket's `from`
 * (or to infinity for the last bracket). Shared by every canton module and
 * the federal calculation — this is the one piece of arithmetic every Swiss
 * tax schedule ultimately reduces to. */
export function taxFromBrackets(amount: number, brackets: Bracket[]): number {
  if (amount <= 0 || brackets.length === 0) return 0
  let tax = 0
  for (let i = 0; i < brackets.length; i++) {
    const from = brackets[i].from
    if (amount <= from) break
    const to = i + 1 < brackets.length ? brackets[i + 1].from : Infinity
    const slice = Math.min(amount, to) - from
    tax += slice * brackets[i].rate
  }
  return tax
}

/**
 * Several cantons (SZ, NW, AI, SG, SH, ...) don't publish a separate married
 * bracket table at all — instead the law says to divide income by a
 * splitting divisor, look up the average rate that produces on the single
 * schedule, then apply that rate to the FULL income:
 * tax_married(x) = divisor × tax_single(x / divisor). Because tax_single is
 * piecewise-linear, this is exactly equivalent to scaling every threshold in
 * the single schedule by the divisor while keeping the same marginal rates
 * (proof: d/dx[divisor × tax_single(x/divisor)] = tax_single'(x/divisor), so
 * the marginal rate at the scaled threshold divisor×T equals the marginal
 * rate at T in the single schedule) — which is what this computes, so a
 * canton only needs to store its single-filer schedule(s) plus its divisor.
 */
export function scaleBracketsForSplitting(brackets: Bracket[], divisor: number): Bracket[] {
  return brackets.map((b) => ({ from: b.from * divisor, rate: b.rate }))
}
