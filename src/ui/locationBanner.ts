export interface LocationBannerState {
  name: string
  cantonCode: string | null
  /** True for a non-residential BFS entry (state forest, shared inter-communal
   * land) — see MunicipalityClickEvent.nonCommunal. */
  nonCommunal?: boolean
}

export function renderLocationBanner(container: HTMLElement, selection: LocationBannerState | null) {
  if (!selection) {
    container.innerHTML = `<div class="location-banner location-banner-empty">No municipality selected</div>`
    return
  }
  container.innerHTML = `
    <div class="location-banner">
      <span class="location-name">${escapeHtml(selection.name)}</span>
      ${selection.cantonCode ? `<span class="location-canton">(${escapeHtml(selection.cantonCode)})</span>` : ''}
    </div>
    ${
      selection.nonCommunal
        ? `<p class="hint">Not a residential municipality — this is uninhabited state forest / shared inter-communal land with no tax jurisdiction of its own. Pick a nearby town or village instead.</p>`
        : ''
    }
  `
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}
