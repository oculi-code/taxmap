import './style.css'
import { loadPersistedState, savePersistedState } from './lib/persistence'
import { MapView, type MunicipalityClickEvent } from './map/mapView'
import { PRECISE_CANTONS } from './tax/lib/cantonRegistry'
import { computeSeparateTaxationPreview, computeTaxBreakdown } from './tax/lib/engine'
import type { CantonCode, TaxBreakdown, TaxInput } from './types'
import { mountTaxForm } from './ui/form'
import { renderLocationBanner } from './ui/locationBanner'
import { renderMobilePeek } from './ui/mobilePeek'
import { mountMunicipalitySearch } from './ui/municipalitySearch'
import { renderResults } from './ui/results'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <header class="app-header">
    <h1>Swiss Tax Map</h1>
    <p>Click a municipality to estimate income &amp; wealth tax — federal, cantonal, communal and church.</p>
  </header>
  <div class="app-body">
    <aside class="sidebar">
      <button type="button" class="mobile-peek" id="mobile-peek-mount" aria-expanded="false"></button>
      <div id="location-mount"></div>
      <div id="search-mount"></div>
      <div id="form-mount"></div>
      <div id="results-mount"></div>
      <details class="about">
        <summary>About this data</summary>
        <p>
          Federal tax figures follow the official 2026 ESTV tariff and deductions. Cantonal/communal/church
          tax is precisely modeled for <strong>all 26 cantons</strong> — Zürich, Bern, Lucerne, Uri, Schwyz,
          Obwalden, Nidwalden, Glarus, Zug, Fribourg, Solothurn, Basel-Stadt, Basel-Landschaft, Schaffhausen,
          Appenzell Ausserrhoden, Appenzell Innerrhoden, St. Gallen, Graubünden, Aargau, Thurgau, Ticino,
          Vaud, Valais, Neuchâtel, Geneva and Jura — from each canton's own current tax law and municipal
          multiplier tables.
          Deduction amounts use the federal schedule everywhere
          (cantons' own deduction rules differ but aren't modeled here); the deductions actually applied are
          always shown. Boundaries are © swisstopo / BFS GEOSTAT (swiss-maps), non-commercial use with
          attribution.
        </p>
      </details>
    </aside>
    <main id="map-mount"></main>
  </div>
`

const mapMount = document.querySelector<HTMLElement>('#map-mount')!
const sidebar = document.querySelector<HTMLElement>('.sidebar')!
const locationMount = document.querySelector<HTMLElement>('#location-mount')!
const searchMount = document.querySelector<HTMLElement>('#search-mount')!
const formMount = document.querySelector<HTMLElement>('#form-mount')!
const resultsMount = document.querySelector<HTMLElement>('#results-mount')!
const mobilePeekMount = document.querySelector<HTMLButtonElement>('#mobile-peek-mount')!

let selected: MunicipalityClickEvent | null = null
let nonCommunalSelection: MunicipalityClickEvent | null = null
let lastBreakdown: TaxBreakdown | null = null

// Mobile only (see .mobile-peek in style.css): the sidebar becomes a bottom
// sheet collapsed to a small peek bar showing the current selection + total
// tax, so the map stays the primary view. Tapping the bar expands it to
// reveal the search box and form; picking a municipality collapses it again
// so the result is visible on the map right away. No-op above the mobile
// breakpoint, where the sidebar is always fully visible alongside the map.
let sidebarExpanded = false
function setSidebarExpanded(expanded: boolean) {
  sidebarExpanded = expanded
  sidebar.classList.toggle('expanded', expanded)
  mobilePeekMount.setAttribute('aria-expanded', String(expanded))
  updateMobilePeek()
}
mobilePeekMount.addEventListener('click', () => setSidebarExpanded(!sidebarExpanded))

function updateMobilePeek() {
  renderMobilePeek(
    mobilePeekMount,
    {
      name: selected?.name ?? nonCommunalSelection?.name ?? null,
      cantonCode: selected?.cantonCode ?? nonCommunalSelection?.cantonCode ?? null,
      breakdown: lastBreakdown,
    },
    sidebarExpanded,
  )
  // The collapsed sheet reveals exactly this many pixels of itself (see
  // --peek-height in style.css) — measured from the real rendered content
  // rather than guessed, since the bar's height varies with what's shown
  // (a plain hint vs. a municipality name + tax amount) and a stale/wrong
  // guess would either clip content or leave an ugly gap.
  sidebar.style.setProperty('--peek-height', `${mobilePeekMount.offsetHeight}px`)
}

renderLocationBanner(locationMount, null)
renderResults(resultsMount, null, null)
updateMobilePeek()

const persisted = loadPersistedState()

const defaultInput: TaxInput = {
  maritalStatus: 'single',
  income: 80000,
  spouseIncome: 0,
  wealth: 0,
  numberOfChildren: 0,
  faith: 'none',
  spouseFaith: 'none',
  bfsNumber: null,
}
const initialInput: TaxInput = persisted ? { ...defaultInput, ...persisted.household } : defaultInput

const form = mountTaxForm(formMount, {
  initial: initialInput,
  onChange: () => {
    recompute()
    scheduleChoroplethUpdate()
    persistState()
  },
})

const map = new MapView(mapMount)

function selectMunicipality(e: MunicipalityClickEvent, opts: { pan: boolean }) {
  // A handful of BFS entries (uninhabited state forest, shared inter-communal
  // land — see mapView.ts) have geometry but no resident population, so no
  // tax jurisdiction applies there at all. Show the map selection and an
  // explanatory banner, but don't treat it as a real household location:
  // skip persistence and skip the tax computation entirely rather than
  // silently falling through to a canton module that has no data for it.
  selected = e.nonCommunal ? null : e
  nonCommunalSelection = e.nonCommunal ? e : null
  form.setBfsNumber(e.nonCommunal ? null : e.bfsNumber)
  map.setSelectedMunicipality(e.bfsNumber)
  if (opts.pan) map.flyToMunicipality(e.bfsNumber)
  renderLocationBanner(locationMount, { name: e.name, cantonCode: e.cantonCode, nonCommunal: e.nonCommunal })
  recompute()
  if (!e.nonCommunal) persistState()
  setSidebarExpanded(false)
}

function persistState() {
  const { bfsNumber, ...household } = form.getState()
  savePersistedState({ household, selectedBfsNumber: bfsNumber })
}

map.onMunicipalityClick((e) => selectMunicipality(e, { pan: false }))

function recompute() {
  if (!selected) {
    lastBreakdown = null
    const hint = nonCommunalSelection
      ? `${nonCommunalSelection.name} has no tax jurisdiction of its own — pick a nearby town or village instead.`
      : undefined
    renderResults(resultsMount, null, null, hint)
    updateMobilePeek()
    return
  }
  const input = form.getState()
  const cantonCode = selected.cantonCode as CantonCode | null
  const breakdown = computeTaxBreakdown(input, cantonCode, selected.bfsNumber)
  const separate = computeSeparateTaxationPreview(input, cantonCode, selected.bfsNumber)
  lastBreakdown = breakdown
  renderResults(resultsMount, breakdown, separate)
  updateMobilePeek()
}

// A canton's LOCAL multiplier percentage alone isn't comparable nationwide —
// e.g. Glarus's brackets run up to 21% with a modest ~60% municipal
// multiplier, while Schwyz's brackets top out at 3.9% with a much larger
// combined district+municipal multiplier. So the choropleth runs the real
// engine for the household currently entered in the form, in every
// municipality, and colors by actual computed total tax — updating live as
// the user edits their details (debounced: this walks ~1000+ municipalities,
// cheap individually but not free, and firing it on every keystroke would be
// wasteful). Uses totalTax rather than effectiveRate: the household (and so
// grossIncome) is identical across every municipality in this loop, so the
// two are just a constant scale factor apart whenever grossIncome > 0 — but
// effectiveRate is forced to 0 for every municipality when grossIncome is 0
// (see engine.ts, to avoid a 0/0 division), which would otherwise flatten
// the whole map to one color even though wealth tax can still vary a lot.
function updateChoropleth() {
  const input = form.getState()
  const values = new Map<number, number>()
  for (const m of map.getMunicipalityList()) {
    const cantonCode = m.cantonCode as CantonCode | null
    if (!cantonCode || !PRECISE_CANTONS.has(cantonCode)) continue
    const breakdown = computeTaxBreakdown(input, cantonCode, m.bfsNumber)
    values.set(m.bfsNumber, breakdown.totalTax)
  }
  if (values.size === 0) return
  const max = Math.max(...values.values())
  const min = Math.min(...values.values())
  const normalized = new Map<number, number>()
  for (const [bfs, v] of values) {
    normalized.set(bfs, max > min ? (v - min) / (max - min) : 0.5)
  }
  map.setChoroplethValues(normalized)
}

let choroplethTimer: ReturnType<typeof setTimeout> | undefined
function scheduleChoroplethUpdate() {
  clearTimeout(choroplethTimer)
  choroplethTimer = setTimeout(updateChoropleth, 400)
}

map
  .init()
  .then(() => {
    mountMunicipalitySearch(searchMount, {
      municipalities: map.getMunicipalityList(),
      // getMunicipalityList() already excludes non-communal entries.
      onSelect: (entry) => selectMunicipality({ ...entry, nonCommunal: false }, { pan: true }),
    })

    if (persisted?.selectedBfsNumber != null) {
      const entry = map.getMunicipalityList().find((m) => m.bfsNumber === persisted.selectedBfsNumber)
      if (entry) selectMunicipality({ ...entry, nonCommunal: false }, { pan: true })
    }

    updateChoropleth()
  })
  .catch((err) => {
    console.error('Failed to load map', err)
    mapMount.innerHTML = `<p class="hint" style="padding:16px">Failed to load map data. Run <code>npm run prep:boundaries</code> first.</p>`
  })
