// One-off data prep: builds public/data/boundaries/*.geojson from the swiss-maps
// package (geometry) joined with the BFS municipality register (names/districts).
// Run with: npm run prep:boundaries
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import * as topojson from 'topojson-client'
import shapefile from 'shapefile'
import proj4 from 'proj4'

const root = path.dirname(fileURLToPath(import.meta.url)) + '/..'
const MUNI_YEAR = '2026'
const DISTRICT_YEAR = '2021' // most recent swiss-maps vintage with populated district id/name

// The topojson file (ch-combined.json, used for country/cantons/municipalities
// below) is already in WGS84. But swiss-maps' standalone per-layer shapefiles
// (districts.shp, lakes.shp) are in Swiss LV95 (EPSG:2056) projected meters,
// e.g. easting/northing like [2692635, 1247484] — MapLibre needs WGS84
// lng/lat, so geometry read straight from those .shp files must be
// reprojected or it renders in the wrong place (or nowhere visible) entirely.
// proj4's bundled definition set doesn't include EPSG:2056 (Swiss CH1903+ /
// LV95) — register its official definition (from epsg.io/2056) explicitly.
proj4.defs(
  'EPSG:2056',
  '+proj=somerc +lat_0=46.9524055555556 +lon_0=7.43958333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs',
)
const lv95ToWgs84 = proj4('EPSG:2056', 'EPSG:4326')
function reprojectGeometry(geometry) {
  const project = (pos) => lv95ToWgs84.forward(pos)
  const mapCoords = (coords, depth) => (depth === 0 ? project(coords) : coords.map((c) => mapCoords(c, depth - 1)))
  const depth = { Point: 0, LineString: 1, Polygon: 2, MultiPolygon: 3 }[geometry.type]
  return { ...geometry, coordinates: mapCoords(geometry.coordinates, depth) }
}

// IMPORTANT: this reprojection is only used below to compute a MATCHING
// centroid for districts (see districts section) — it is NOT used to
// reproject geometry actually rendered on the map. An earlier version of
// this script rendered districts.shp/lakes.shp geometry directly (after
// reprojecting it), but that geometry comes from a differently-digitized/
// differently-simplified dataset than ch-combined.json's topojson (which
// country/cantons/municipalities all render from) — even with perfectly
// correct reprojection, the two datasets' shorelines and borders don't
// exactly coincide, which showed up as a visible gap/misalignment between
// filled polygons and outlines at lake shores and district borders. Fixed
// by rendering districts AND lakes from `topo.objects.districts`/`.lakes`
// (the SAME topojson, already WGS84, same topology as everything else —
// guarantees pixel-perfect alignment) and recovering names by matching
// against the standalone shapefiles instead (see below for how, since the
// 2026 topojson's districts/lakes objects lost their own name attributes
// upstream, same regression as municipalities).
function centroid(geometry) {
  let sx = 0
  let sy = 0
  let n = 0
  const visit = (c) => {
    if (typeof c[0] === 'number') {
      sx += c[0]
      sy += c[1]
      n++
    } else {
      c.forEach(visit)
    }
  }
  visit(geometry.coordinates)
  return [sx / n, sy / n]
}

const cantons = JSON.parse(readFileSync(`${root}/data/reference/cantons.json`, 'utf8'))
const cantonById = new Map(cantons.map((c) => [c.id, c]))

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/)
  const header = lines[0].split(',')
  return lines.slice(1).map((line) => {
    const cells = line.split(',')
    const row = {}
    header.forEach((h, i) => (row[h] = cells[i] ?? ''))
    return row
  })
}

const registerPath = `${root}/data/raw/bfs_municipalities_register.csv`
if (!existsSync(registerPath)) {
  console.error(`Missing ${registerPath} — run the BFS municipality register fetch first.`)
  process.exit(1)
}
const register = parseCsv(readFileSync(registerPath, 'utf8'))
const registerByBfs = new Map(register.map((r) => [Number(r.bfsNumber), r]))

// --- municipalities: geometry from topojson, canton id from the raw dbf, name/district from BFS register ---
const topo = JSON.parse(readFileSync(`${root}/node_modules/swiss-maps/${MUNI_YEAR}/ch-combined.json`, 'utf8'))

const muniDbfSource = await shapefile.open(
  `${root}/node_modules/swiss-maps/${MUNI_YEAR}/municipalities.shp`,
  `${root}/node_modules/swiss-maps/${MUNI_YEAR}/municipalities.dbf`,
)
const cantonIdByBfs = new Map()
for (let r; !(r = await muniDbfSource.read()).done; ) {
  cantonIdByBfs.set(r.value.properties.id, r.value.properties.KTNR)
}

// A handful of BFS "commune-equivalent" entries in the topology are not real
// municipalities at all — uninhabited state forest / shared inter-communal
// land with no resident population and no tax jurisdiction of its own. None
// of them are in the BFS register (which only covers real municipalities),
// and their names were dropped from the shapefile's own attributes in the
// 2025+ vintage (present, unmangled, in earlier vintages — that's where
// these were sourced from) — so both the name and the "this isn't a real
// municipality" flag need a manual override rather than falling back to the
// `#<bfsNumber>` placeholder, which read as a data bug rather than what it
// actually is.
const NON_COMMUNAL_NAMES = new Map([
  [2391, 'Staatswald Galm'], // FR: uninhabited state forest exclave
  [5391, 'Comunanza Cadenazzo/Monteceneri'], // TI: shared inter-communal land, no residents
  [5394, 'Comunanza Capriasca/Lugano'], // TI: shared inter-communal land, no residents
])

const municipalitiesFeatures = topojson.feature(topo, topo.objects.municipalities).features
let unmatchedMunis = 0
const municipalitiesGeojson = {
  type: 'FeatureCollection',
  features: municipalitiesFeatures.map((f) => {
    const bfsNumber = f.id
    const reg = registerByBfs.get(bfsNumber)
    const cantonId = cantonIdByBfs.get(bfsNumber)
    const canton = cantonById.get(cantonId)
    const nonCommunalName = NON_COMMUNAL_NAMES.get(bfsNumber)
    if (!reg && !nonCommunalName) unmatchedMunis++
    return {
      type: 'Feature',
      geometry: f.geometry,
      properties: {
        bfsNumber,
        name: reg?.name || nonCommunalName || `#${bfsNumber}`,
        cantonId: cantonId ?? null,
        cantonCode: canton?.code ?? reg?.cantonCode ?? null,
        districtNumber: reg?.districtNumber ? Number(reg.districtNumber) : null,
        districtName: reg?.districtName || null,
        nonCommunal: nonCommunalName != null,
      },
    }
  }),
}
if (unmatchedMunis > 0) {
  console.warn(`municipalities: ${unmatchedMunis} of ${municipalitiesFeatures.length} had no BFS register match (name fell back to "#id")`)
}

// --- cantons: geometry from topojson, attributes from the hardcoded reference table ---
const cantonsFeatures = topojson.feature(topo, topo.objects.cantons).features
const cantonsGeojson = {
  type: 'FeatureCollection',
  features: cantonsFeatures.map((f) => {
    const canton = cantonById.get(f.id)
    return {
      type: 'Feature',
      geometry: f.geometry,
      properties: { id: f.id, code: canton?.code ?? null, name: canton?.name ?? `Canton ${f.id}` },
    }
  }),
}

// --- country: single feature ---
const countryFeatures = topojson.feature(topo, topo.objects.country).features
const countryGeojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: countryFeatures[0].geometry,
      properties: { id: 'CH', name: 'Schweiz / Suisse / Svizzera / Svizra' },
    },
  ],
}

// --- districts: geometry from the topojson (see the big comment above) —
// names recovered by nearest-centroid match against the 2021 shapefile
// (which still has them). Not a stable key join (the 2026 topology has 144
// districts vs. the 2021 shapefile's 143 — a real boundary change somewhere
// between vintages, not a bug), but district shapes are large and few, so
// nearest-centroid is unambiguous; anything further than ~0.3° away (well
// beyond any real district's radius) is left unmatched rather than guessed. ---
const districtTopoFeatures = topojson.feature(topo, topo.objects.districts).features
const districtShpSource = await shapefile.open(
  `${root}/node_modules/swiss-maps/${DISTRICT_YEAR}/districts.shp`,
  `${root}/node_modules/swiss-maps/${DISTRICT_YEAR}/districts.dbf`,
)
const districtShpByCentroid = []
for (let r; !(r = await districtShpSource.read()).done; ) {
  districtShpByCentroid.push({
    centroid: centroid(reprojectGeometry(r.value.geometry)),
    name: typeof r.value.properties.name === 'string' ? r.value.properties.name.replace(/\0/g, '').trim() : r.value.properties.name,
    KTNR: r.value.properties.KTNR,
  })
}
let unmatchedDistricts = 0
const districtsGeojson = {
  type: 'FeatureCollection',
  features: districtTopoFeatures.map((f, i) => {
    const c = centroid(f.geometry)
    let best = null
    let bestDist = Infinity
    for (const cand of districtShpByCentroid) {
      const d = Math.hypot(cand.centroid[0] - c[0], cand.centroid[1] - c[1])
      if (d < bestDist) {
        bestDist = d
        best = cand
      }
    }
    const matched = best && bestDist <= 0.3 ? best : null
    if (!matched) unmatchedDistricts++
    const canton = matched ? cantonById.get(matched.KTNR) : null
    return {
      type: 'Feature',
      geometry: f.geometry,
      properties: {
        id: i,
        name: matched?.name ?? null,
        cantonId: matched?.KTNR ?? null,
        cantonCode: canton?.code ?? null,
      },
    }
  }),
}
if (unmatchedDistricts > 0) {
  console.warn(`districts: ${unmatchedDistricts} of ${districtTopoFeatures.length} had no confident 2021-shapefile name match (left null)`)
}

// --- lakes: geometry from the topojson (see the big comment above) — the 22
// major named lakes, so they can be rendered in a distinct blue rather than
// reading as an unlabeled gap/whatever color happens to show through
// underneath (the country/municipality fills don't carve lakes out as
// holes). Names recovered by joining on `id`, which — unlike districts — IS
// preserved on the topojson lake features and matches 1:1 against the
// standalone lakes.shp/.dbf (verified: all 22 join cleanly). ---
const lakeTopoFeatures = topojson.feature(topo, topo.objects.lakes).features
const lakeShpSource = await shapefile.open(`${root}/node_modules/swiss-maps/${MUNI_YEAR}/lakes.shp`, `${root}/node_modules/swiss-maps/${MUNI_YEAR}/lakes.dbf`)
const lakeNameById = new Map()
for (let r; !(r = await lakeShpSource.read()).done; ) {
  lakeNameById.set(r.value.properties.id, r.value.properties.name.replace(/\0/g, '').trim())
}
const lakesGeojson = {
  type: 'FeatureCollection',
  features: lakeTopoFeatures.map((f) => ({
    type: 'Feature',
    geometry: f.geometry,
    properties: { id: f.id, name: lakeNameById.get(f.id) ?? null },
  })),
}

const outDir = `${root}/public/data/boundaries`
writeFileSync(`${outDir}/country.geojson`, JSON.stringify(countryGeojson))
writeFileSync(`${outDir}/cantons.geojson`, JSON.stringify(cantonsGeojson))
writeFileSync(`${outDir}/districts.geojson`, JSON.stringify(districtsGeojson))
writeFileSync(`${outDir}/municipalities.geojson`, JSON.stringify(municipalitiesGeojson))
writeFileSync(`${outDir}/lakes.geojson`, JSON.stringify(lakesGeojson))

console.log('Wrote boundaries:')
console.log(`  country: 1 feature`)
console.log(`  cantons: ${cantonsGeojson.features.length} features`)
console.log(`  districts: ${districtsGeojson.features.length} features (vintage ${DISTRICT_YEAR})`)
console.log(`  municipalities: ${municipalitiesGeojson.features.length} features (vintage ${MUNI_YEAR})`)
console.log(`  lakes: ${lakesGeojson.features.length} features (vintage ${MUNI_YEAR})`)
