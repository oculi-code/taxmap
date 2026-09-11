import type { SeparateTaxationComparison, TaxBreakdown } from '../types'

const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 })
const pct = (x: number) => `${(x * 100).toFixed(1)}%`

export function renderResults(
  container: HTMLElement,
  breakdown: TaxBreakdown | null,
  separate: SeparateTaxationComparison | null,
  emptyHint?: string,
) {
  if (!breakdown) {
    container.innerHTML = `<p class="hint">${escapeHtml(emptyHint ?? 'Enter your details and pick a municipality on the map to see an estimate.')}</p>`
    return
  }

  container.innerHTML = `
    <div class="results">
      <div class="results-total">
        <span class="results-total-label">Estimated total tax</span>
        <span class="results-total-amount">${chf.format(breakdown.totalTax)}</span>
        <span class="results-total-sub">${pct(breakdown.effectiveRate)} of gross income</span>
        ${
          !breakdown.precise
            ? `<span class="badge badge-approx">Approximate — precise cantonal tax law not yet modeled for this canton</span>`
            : `<span class="badge badge-precise">Based on modeled cantonal tax law</span>`
        }
      </div>

      ${
        breakdown.warnings.length > 0
          ? `<div class="warning-banner">
              ${breakdown.warnings.map((w) => `<p>⚠️ ${escapeHtml(w)}</p>`).join('')}
            </div>`
          : ''
      }

      <table class="results-table">
        <thead><tr><th>Component</th><th>Base</th><th>Rate</th><th>Amount</th></tr></thead>
        <tbody>
          ${breakdown.components
            .map(
              (c) => `
            <tr class="${c.warning ? 'row-warning' : ''}"${c.warning ? ` title="${escapeHtml(c.warning)}"` : ''}>
              <td>${escapeHtml(c.label)}${c.warning ? ' ⚠️' : ''}</td>
              <td>${chf.format(c.baseTax)}</td>
              <td>${c.multiplier != null ? pct(c.multiplier) : '—'}</td>
              <td>${chf.format(c.amount)}</td>
            </tr>`,
            )
            .join('')}
        </tbody>
      </table>

      <details class="deductions">
        <summary>Deductions applied (${chf.format(breakdown.grossIncome - breakdown.taxableIncome)} total)</summary>
        <ul>
          ${breakdown.deductions.map((d) => `<li>${escapeHtml(d.label)}: ${chf.format(d.amount)}</li>`).join('')}
        </ul>
        <p class="hint">Deduction amounts use the federal schedule for all cantons in this preview, even where a canton's own rules differ — only the tax rates themselves are canton-specific.</p>
      </details>

      ${separate ? renderSeparateTaxation(separate) : ''}
    </div>
  `
}

function renderSeparateTaxation(s: SeparateTaxationComparison) {
  const delta = s.difference
  const direction = delta < 0 ? 'less' : delta > 0 ? 'more' : 'the same'
  return `
    <div class="separate-taxation">
      <h3>Preview: individual/separate taxation</h3>
      <p class="hint">
        Switzerland does not yet have separate taxation of spouses — this is a simulation of a proposed
        reform with no finalized official formula. It models each spouse being taxed individually on
        their own income (wealth split evenly), then summed.
      </p>
      <table class="results-table">
        <tbody>
          <tr><td>Current joint taxation</td><td>${chf.format(s.jointTotal)}</td></tr>
          <tr><td>Simulated separate taxation</td><td>${chf.format(s.separateTotal)}</td></tr>
          <tr><td>Difference</td><td>${chf.format(Math.abs(delta))} ${direction}</td></tr>
        </tbody>
      </table>
    </div>
  `
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}
