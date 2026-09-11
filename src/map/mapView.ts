import {
  AttributionControl,
  config,
  GeoJSONSource,
  Map as MaplibreMap,
  NavigationControl,
  type LngLatBoundsLike,
  type MapLayerMouseEvent,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { MunicipalityListEntry } from '../types'

// MapLibre resolves its worker script relative to import.meta.url, which
// points at the bundled app chunk (not the original package) once built —
// so the worker 404s and GeoJSON sources silently never finish loading.
// `npm run predev`/`prebuild` (see scripts/copy-maplibre-worker.mjs) mirrors
// the worker's small multi-file bundle into public/, and we point MapLibre
// at that static, always-correctly-resolvable path instead. This is a plain
// fetched URL, not something Vite rewrites for us, so it must be built off
// import.meta.env.BASE_URL to keep working when the app is served from a
// subdirectory (see vite.config.ts's `base` setting).
config.WORKER_URL = `${import.meta.env.BASE_URL}vendor/maplibre-gl/maplibre-gl-worker.mjs`

const SWITZERLAND_BOUNDS: LngLatBoundsLike = [
  [5.9, 45.75],
  [10.6, 47.85],
]

export interface MunicipalityClickEvent {
  bfsNumber: number
  name: string
  cantonCode: string | null
  /** True for a handful of BFS "commune-equivalent" entries that aren't real
   * municipalities — uninhabited state forest / shared inter-communal land
   * with no resident population and no tax jurisdiction (see
   * scripts/prepare-boundaries.mjs's NON_COMMUNAL_NAMES). */
  nonCommunal: boolean
}

/** Wraps a blank-canvas MapLibre map (no external basemap tiles — this is a
 * thematic choropleth of administrative divisions, not a street map) that
 * renders all four boundary layers and a data-driven municipality choropleth. */
export class MapView {
  private map: MaplibreMap
  private ready: Promise<void>
  private selectedBfsNumber: number | null = null
  private clickHandlers: Array<(e: MunicipalityClickEvent) => void> = []
  private municipalitiesGeojson: GeoJSON.FeatureCollection | null = null

  constructor(container: HTMLElement) {
    this.map = new MaplibreMap({
      container,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#dce6ea' } }],
      },
      bounds: SWITZERLAND_BOUNDS,
      fitBoundsOptions: { padding: 24 },
      attributionControl: false,
    })
    this.map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    this.map.addControl(
      new AttributionControl({
        customAttribution: '© swisstopo / BFS GEOSTAT (swiss-maps) — geodata for non-commercial use',
      }),
    )

    this.ready = new Promise((resolve) => {
      this.map.on('load', () => resolve())
    })

    if (import.meta.env.DEV) {
      ;(window as unknown as { __map: MaplibreMap }).__map = this.map
    }
  }

  async init() {
    await this.ready
    await this.loadLayers()
    this.wireInteraction()
  }

  private async loadLayers() {
    const base = import.meta.env.BASE_URL
    const [country, cantons, districts, municipalities, lakes] = await Promise.all([
      fetchJson(`${base}data/boundaries/country.geojson`),
      fetchJson(`${base}data/boundaries/cantons.geojson`),
      fetchJson(`${base}data/boundaries/districts.geojson`),
      fetchJson(`${base}data/boundaries/municipalities.geojson`),
      fetchJson(`${base}data/boundaries/lakes.geojson`),
    ])

    this.municipalitiesGeojson = municipalities as GeoJSON.FeatureCollection

    this.map.addSource('country', { type: 'geojson', data: country })
    this.map.addSource('cantons', { type: 'geojson', data: cantons })
    this.map.addSource('districts', { type: 'geojson', data: districts })
    this.map.addSource('municipalities', { type: 'geojson', data: municipalities, promoteId: 'bfsNumber' })
    this.map.addSource('lakes', { type: 'geojson', data: lakes })

    this.map.addLayer({
      id: 'country-fill',
      type: 'fill',
      source: 'country',
      paint: { 'fill-color': '#c9d6dc' },
    })

    this.map.addLayer({
      id: 'municipalities-fill',
      type: 'fill',
      source: 'municipalities',
      paint: {
        'fill-color': [
          'case',
          ['!=', ['feature-state', 'value'], null],
          ['interpolate', ['linear'], ['feature-state', 'value'], 0, '#eaf3ea', 0.5, '#7fb37f', 1, '#1f6b3a'],
          '#f4efe6',
        ],
        'fill-opacity': 0.9,
      },
    })

    // Lakes aren't carved out of the municipality/country polygons, so
    // without their own layer they'd just show whatever fill color happens
    // to land there (choropleth green included) — rendered above the
    // municipality fill so they read clearly as water against it, but below
    // the boundary linework so borders and the selection highlight still
    // draw crisply on top.
    this.map.addLayer({
      id: 'lakes-fill',
      type: 'fill',
      source: 'lakes',
      paint: { 'fill-color': '#3d7fb8', 'fill-opacity': 0.92 },
    })
    this.map.addLayer({
      id: 'lakes-outline',
      type: 'line',
      source: 'lakes',
      paint: { 'line-color': '#2c5f8f', 'line-width': 0.6 },
    })

    this.map.addLayer({
      id: 'municipalities-selected',
      type: 'line',
      source: 'municipalities',
      paint: { 'line-color': '#e6552e', 'line-width': 3 },
      filter: ['==', ['get', 'bfsNumber'], -1],
    })

    this.map.addLayer({
      id: 'municipalities-outline',
      type: 'line',
      source: 'municipalities',
      paint: { 'line-color': '#ffffff', 'line-width': 0.4, 'line-opacity': 0.6 },
    })

    this.map.addLayer({
      id: 'districts-outline',
      type: 'line',
      source: 'districts',
      paint: { 'line-color': '#5a6b73', 'line-width': 0.8, 'line-opacity': 0.5 },
    })

    this.map.addLayer({
      id: 'cantons-outline',
      type: 'line',
      source: 'cantons',
      paint: { 'line-color': '#2c3e44', 'line-width': 1.6 },
    })

    this.map.addLayer({
      id: 'country-outline',
      type: 'line',
      source: 'country',
      paint: { 'line-color': '#12181a', 'line-width': 2.4 },
    })
  }

  private wireInteraction() {
    this.map.on('mouseenter', 'municipalities-fill', () => {
      this.map.getCanvas().style.cursor = 'pointer'
    })
    this.map.on('mouseleave', 'municipalities-fill', () => {
      this.map.getCanvas().style.cursor = ''
    })
    this.map.on('click', 'municipalities-fill', (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0]
      if (!feature) return
      const props = feature.properties as { bfsNumber: number; name: string; cantonCode: string | null; nonCommunal: boolean }
      this.setSelectedMunicipality(props.bfsNumber)
      for (const handler of this.clickHandlers) {
        handler({ bfsNumber: props.bfsNumber, name: props.name, cantonCode: props.cantonCode, nonCommunal: props.nonCommunal })
      }
    })
  }

  onMunicipalityClick(handler: (e: MunicipalityClickEvent) => void) {
    this.clickHandlers.push(handler)
  }

  setSelectedMunicipality(bfsNumber: number | null) {
    this.selectedBfsNumber = bfsNumber
    this.map.setFilter('municipalities-selected', ['==', ['get', 'bfsNumber'], bfsNumber ?? -1])
  }

  getSelectedMunicipality() {
    return this.selectedBfsNumber
  }

  /** Full list of real, tax-jurisdiction municipalities for search/autocomplete
   * and the choropleth, available once init() resolves — excludes the handful
   * of non-communal entries (uninhabited state forest, shared inter-communal
   * land) that have geometry but no resident population or tax data. */
  getMunicipalityList(): MunicipalityListEntry[] {
    if (!this.municipalitiesGeojson) return []
    return this.municipalitiesGeojson.features
      .map((f) => f.properties as { bfsNumber: number; name: string; cantonCode: string | null; nonCommunal: boolean })
      .filter((props) => !props.nonCommunal)
      .map((props) => ({ bfsNumber: props.bfsNumber, name: props.name, cantonCode: props.cantonCode }))
  }

  /** Pans/zooms the camera to fit the given municipality's geometry. */
  flyToMunicipality(bfsNumber: number) {
    const feature = this.municipalitiesGeojson?.features.find((f) => f.properties?.bfsNumber === bfsNumber)
    if (!feature) return
    const bounds = geometryBounds(feature.geometry)
    if (!bounds) return
    this.map.fitBounds(bounds, { padding: 80, maxZoom: 13, duration: 800 })
  }

  /** Colors the municipality choropleth by a normalized 0..1 value per BFS number. */
  setChoroplethValues(values: Map<number, number>) {
    const source = this.map.getSource('municipalities') as GeoJSONSource | undefined
    if (!source) return
    // feature-state needs a source-loaded geojson with matching `id`; we set
    // promoteId at layer add time is not used here, so we address features by
    // querying rendered features is unreliable pre-load — instead we iterate
    // via setFeatureState using the BFS number as the feature id (see loadLayers,
    // where geojson features carry properties.bfsNumber as their id too).
    for (const [bfsNumber, value] of values) {
      this.map.setFeatureState({ source: 'municipalities', id: bfsNumber }, { value })
    }
  }
}

async function fetchJson(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.json()
}

type NestedCoords = number | NestedCoords[]

/** [minLng, minLat, maxLng, maxLat] bounding box of a Polygon/MultiPolygon. */
function geometryBounds(geometry: GeoJSON.Geometry): LngLatBoundsLike | null {
  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity

  function visit(coords: NestedCoords): void {
    if (!Array.isArray(coords)) return
    if (typeof coords[0] === 'number') {
      const [lng, lat] = coords as [number, number]
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    } else {
      for (const c of coords) visit(c)
    }
  }

  if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
    visit(geometry.coordinates)
  } else {
    return null
  }
  if (!Number.isFinite(minLng)) return null
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ]
}
