import { defineConfig } from 'vite'

export default defineConfig({
  // Relative (not absolute) base so the build works when served from any
  // subdirectory (e.g. https://example.com/taxmap/) without knowing that
  // path in advance — asset references in index.html become `./assets/...`
  // instead of `/assets/...`. Runtime fetches of files under public/ (see
  // src/map/mapView.ts) must use import.meta.env.BASE_URL for the same
  // reason, since those aren't rewritten by Vite automatically.
  base: './',
  // maplibre-gl loads its worker via a relative dynamic import that Vite's
  // dependency pre-bundler doesn't resolve correctly — excluding it from
  // pre-bundling serves it straight from node_modules instead, where the
  // worker file is found.
  optimizeDeps: { exclude: ['maplibre-gl'] },
})
