import { t } from '../i18n/translations'
import type { TaxBreakdown } from '../types'

export interface MobilePeekState {
  name: string | null
  cantonCode: string | null
  breakdown: TaxBreakdown | null
}

const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 })

/** Mobile-only collapsed bar (see .mobile-peek in style.css — hidden entirely
 * above the mobile breakpoint) showing the current selection and its total
 * tax at a glance, without needing to expand the sheet covering the map.
 * This IS the prominent total-tax display on mobile (large amount, same
 * visual weight results.ts's own .results-total-amount would otherwise
 * have) — results.ts hides its own big total on narrow viewports so the
 * number isn't shown twice. */
export function renderMobilePeek(container: HTMLElement, state: MobilePeekState, expanded: boolean) {
  const title = state.name
    ? `${escapeHtml(state.name)}${state.cantonCode ? ` (${escapeHtml(state.cantonCode)})` : ''}`
    : t('appTitle')
  const amountRow = state.breakdown
    ? `<span class="mobile-peek-amount">${chf.format(state.breakdown.totalTax)}</span><span class="mobile-peek-rate">${(state.breakdown.effectiveRate * 100).toFixed(1)}%</span>`
    : `<span class="mobile-peek-hint">${escapeHtml(t('mobilePeekHint'))}</span>`

  container.innerHTML = `
    <span class="mobile-peek-handle" aria-hidden="true"></span>
    <span class="mobile-peek-text">
      <span class="mobile-peek-title">${title}</span>
      <span class="mobile-peek-amount-row">${amountRow}</span>
    </span>
    <span class="mobile-peek-chevron${expanded ? ' mobile-peek-chevron-expanded' : ''}" aria-hidden="true">▲</span>
  `
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}
