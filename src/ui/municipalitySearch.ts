import type { MunicipalityListEntry } from '../types'

const MAX_RESULTS = 8

export interface MunicipalitySearchOptions {
  municipalities: MunicipalityListEntry[]
  onSelect: (entry: MunicipalityListEntry) => void
}

/** Prefix-match search box with a click/keyboard-navigable dropdown. Matches
 * if the query is a prefix of the name, or of any word within the name (so
 * "Glis" finds "Brigue-Glis", not just names starting with "Glis"). */
export function mountMunicipalitySearch(container: HTMLElement, options: MunicipalitySearchOptions) {
  container.innerHTML = `
    <div class="muni-search">
      <input type="text" class="muni-search-input" placeholder="Search municipality…" autocomplete="off" />
      <ul class="muni-search-dropdown" hidden></ul>
    </div>
  `

  const input = container.querySelector<HTMLInputElement>('.muni-search-input')!
  const dropdown = container.querySelector<HTMLUListElement>('.muni-search-dropdown')!
  let matches: MunicipalityListEntry[] = []
  let activeIndex = -1

  function normalize(s: string): string {
    return s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  }

  const normalizedNames = options.municipalities.map((m) => normalize(m.name))

  function search(query: string): MunicipalityListEntry[] {
    const q = normalize(query.trim())
    if (!q) return []
    const results: MunicipalityListEntry[] = []
    for (let i = 0; i < options.municipalities.length; i++) {
      const n = normalizedNames[i]
      if (n.startsWith(q) || new RegExp(`[^a-z0-9]${escapeRegExp(q)}`).test(n)) {
        results.push(options.municipalities[i])
        if (results.length >= MAX_RESULTS) break
      }
    }
    return results
  }

  function render() {
    if (matches.length === 0) {
      dropdown.hidden = true
      dropdown.innerHTML = ''
      return
    }
    dropdown.hidden = false
    dropdown.innerHTML = matches
      .map(
        (m, i) => `
        <li class="muni-search-item${i === activeIndex ? ' active' : ''}" data-index="${i}">
          ${escapeHtml(m.name)}${m.cantonCode ? ` <span class="muni-search-canton">(${m.cantonCode})</span>` : ''}
        </li>`,
      )
      .join('')
  }

  function select(entry: MunicipalityListEntry) {
    input.value = `${entry.name}${entry.cantonCode ? ` (${entry.cantonCode})` : ''}`
    matches = []
    activeIndex = -1
    render()
    options.onSelect(entry)
  }

  input.addEventListener('input', () => {
    matches = search(input.value)
    activeIndex = matches.length > 0 ? 0 : -1
    render()
  })

  input.addEventListener('keydown', (e) => {
    if (matches.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      activeIndex = (activeIndex + 1) % matches.length
      render()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      activeIndex = (activeIndex - 1 + matches.length) % matches.length
      render()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0) select(matches[activeIndex])
    } else if (e.key === 'Escape') {
      matches = []
      activeIndex = -1
      render()
    }
  })

  dropdown.addEventListener('mousedown', (e) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>('.muni-search-item')
    if (!item) return
    e.preventDefault()
    select(matches[Number(item.dataset.index)])
  })

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target as Node)) {
      matches = []
      activeIndex = -1
      render()
    }
  })
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}
