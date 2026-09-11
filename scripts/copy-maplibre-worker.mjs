// maplibre-gl's worker is a small multi-file ESM bundle (worker + a shared
// chunk it imports by relative path). Vite's `?url` asset import only copies
// the one file you name, breaking that relative import once bundled — so
// instead we mirror the whole worker bundle into public/ as static files and
// point maplibre-gl at it directly (see src/map/mapView.ts).
import { copyFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(fileURLToPath(import.meta.url)) + '/..'
const src = `${root}/node_modules/maplibre-gl/dist`
const dest = `${root}/public/vendor/maplibre-gl`

mkdirSync(dest, { recursive: true })
for (const file of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
  copyFileSync(`${src}/${file}`, `${dest}/${file}`)
}
console.log(`Copied maplibre-gl worker bundle to ${dest}`)
