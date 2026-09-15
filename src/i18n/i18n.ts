export type Locale = 'de' | 'fr' | 'it' | 'en'

export const LOCALES: Locale[] = ['de', 'fr', 'it', 'en']

const STORAGE_KEY = 'taxmap.locale.v1'

function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALES as string[]).includes(v)
}

function detectInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isLocale(stored)) return stored
  } catch {
    // Private browsing / storage disabled — fall through to the default.
  }
  return 'de'
}

let currentLocale: Locale = detectInitialLocale()
const listeners = new Set<(locale: Locale) => void>()

export function getLocale(): Locale {
  return currentLocale
}

export function setLocale(locale: Locale) {
  if (locale === currentLocale) return
  currentLocale = locale
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Private browsing / storage disabled / quota exceeded — persistence is
    // a convenience, not a requirement, so fail silently.
  }
  listeners.forEach((fn) => fn(locale))
}

/** Registers `fn` to run whenever the locale changes; returns an unsubscribe. */
export function onLocaleChange(fn: (locale: Locale) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
