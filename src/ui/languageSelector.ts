import { getLocale, LOCALES, setLocale, type Locale } from '../i18n/i18n'
import { t } from '../i18n/translations'

const LOCALE_NAMES: Record<Locale, string> = {
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  en: 'English',
}

export function mountLanguageSelector(container: HTMLElement) {
  container.innerHTML = `
    <select class="lang-select" aria-label="${t('languageLabel')}">
      ${LOCALES.map((locale) => `<option value="${locale}">${LOCALE_NAMES[locale]}</option>`).join('')}
    </select>
  `
  const select = container.querySelector<HTMLSelectElement>('.lang-select')!
  select.value = getLocale()
  select.addEventListener('change', () => setLocale(select.value as Locale))
}
