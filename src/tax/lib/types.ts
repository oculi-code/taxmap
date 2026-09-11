/** Marginal-rate breakpoint: `rate` applies to the slice of the base from this
 * bracket's `from` up to the next bracket's `from` (or to infinity, for the last one). */
export interface Bracket {
  from: number
  rate: number
}

export interface BracketSchedule {
  single: Bracket[]
  married: Bracket[]
}
