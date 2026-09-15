import { t } from '../i18n/translations'
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
    container.innerHTML = `<p class="hint">${escapeHtml(emptyHint ?? t('resultsEmptyHint'))}</p>`
    return
  }

  container.innerHTML = `
    <div class="results">
      <div class="results-total">
        <span class="results-total-label">${t('resultsTotalLabel')}</span>
        <span class="results-total-amount">${chf.format(breakdown.totalTax)}</span>
        <span class="results-total-sub">${t('resultsTotalSub', { pct: pct(breakdown.effectiveRate) })}</span>
        ${
          !breakdown.precise
            ? `<span class="badge badge-approx">${t('badgeApprox')}</span>`
            : `<span class="badge badge-precise">${t('badgePrecise')}</span>`
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
        <thead><tr><th>${t('tableComponent')}</th><th>${t('tableBase')}</th><th>${t('tableRate')}</th><th>${t('tableAmount')}</th></tr></thead>
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
        <summary>${t('deductionsSummary', { amount: chf.format(breakdown.grossIncome - breakdown.taxableIncome) })}</summary>
        <ul>
          ${breakdown.deductions.map((d) => `<li>${escapeHtml(d.label)}: ${chf.format(d.amount)}</li>`).join('')}
        </ul>
        <p class="hint">${t('deductionsHint')}</p>
      </details>

      ${separate ? renderSeparateTaxation(separate) : ''}
    </div>
  `
}

function renderSeparateTaxation(s: SeparateTaxationComparison) {
  const delta = s.difference
  const direction = delta < 0 ? t('directionLess') : delta > 0 ? t('directionMore') : t('directionSame')
  return `
    <div class="separate-taxation">
      <h3>${t('separateTaxationTitle')}</h3>
      <p class="hint">${t('separateTaxationHint')}</p>
      <table class="results-table">
        <tbody>
          <tr><td>${t('currentJointTaxation')}</td><td>${chf.format(s.jointTotal)}</td></tr>
          <tr><td>${t('simulatedSeparateTaxation')}</td><td>${chf.format(s.separateTotal)}</td></tr>
          <tr><td>${t('difference')}</td><td>${chf.format(Math.abs(delta))} ${direction}</td></tr>
        </tbody>
      </table>
    </div>
  `
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}
