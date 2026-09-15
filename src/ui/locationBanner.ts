import { t } from '../i18n/translations'

export interface LocationBannerState {
  name: string
  cantonCode: string | null
  /** True for a non-residential BFS entry (state forest, shared inter-communal
   * land) — see MunicipalityClickEvent.nonCommunal. */
  nonCommunal?: boolean
}

export function renderLocationBanner(container: HTMLElement, selection: LocationBannerState | null) {
  if (!selection) {
    container.innerHTML = `<div class="location-banner location-banner-empty">${t('locationNoneSelected')}</div>`
    return
  }
  container.innerHTML = `
    <div class="location-banner">
      <span class="location-name">${escapeHtml(selection.name)}</span>
      ${selection.cantonCode ? `<span class="location-canton">(${escapeHtml(selection.cantonCode)})</span>` : ''}
    </div>
    ${selection.nonCommunal ? `<p class="hint">${t('locationNonCommunalHint')}</p>` : ''}
  `
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}
