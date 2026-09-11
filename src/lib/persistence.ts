import type { TaxInput } from '../types'

const STORAGE_KEY = 'taxmap.household.v1'

export interface PersistedState {
  household: Omit<TaxInput, 'bfsNumber'>
  selectedBfsNumber: number | null
}

/** Reads and validates the persisted household + selected municipality from
 * localStorage. Returns null on anything unexpected (first visit, private
 * browsing blocking storage, an old/foreign schema) so callers can fall back
 * to sane defaults rather than crash on malformed data. */
export function loadPersistedState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!isValidPersistedState(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export function savePersistedState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Private browsing / storage disabled / quota exceeded — persistence is
    // a convenience, not a requirement, so fail silently.
  }
}

function isValidPersistedState(v: unknown): v is PersistedState {
  if (typeof v !== 'object' || v === null) return false
  const s = v as Record<string, unknown>
  if (typeof s.selectedBfsNumber !== 'number' && s.selectedBfsNumber !== null) return false
  const h = s.household
  if (typeof h !== 'object' || h === null) return false
  const household = h as Record<string, unknown>
  const validFaith = (f: unknown) => f === 'none' || f === 'reformed' || f === 'catholic'
  return (
    (household.maritalStatus === 'single' || household.maritalStatus === 'married') &&
    typeof household.income === 'number' &&
    typeof household.spouseIncome === 'number' &&
    typeof household.wealth === 'number' &&
    typeof household.numberOfChildren === 'number' &&
    validFaith(household.faith) &&
    // spouseFaith didn't exist in older persisted records — accept it being
    // absent (main.ts merges with defaults, filling in 'none') but reject an
    // actually-present, invalid value.
    (household.spouseFaith === undefined || validFaith(household.spouseFaith))
  )
}
