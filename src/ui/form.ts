import type { Faith, MaritalStatus, TaxInput } from '../types'

export interface TaxFormOptions {
  initial: TaxInput
  onChange: (input: TaxInput) => void
}

const faithOptions = `
  <option value="none">None / not affiliated</option>
  <option value="reformed">Reformed (evangelisch-reformiert)</option>
  <option value="catholic">Roman Catholic</option>
`

/** Renders the input form into `container` and calls `onChange` whenever any
 * field changes, with the current, fully-parsed TaxInput. */
export function mountTaxForm(container: HTMLElement, options: TaxFormOptions) {
  const state: TaxInput = { ...options.initial }

  container.innerHTML = `
    <form class="tax-form">
      <fieldset>
        <legend>Household, Income &amp; Wealth (CHF)</legend>

        <div class="field-row">
          <label class="field">
            <span>Marital status</span>
            <select name="maritalStatus">
              <option value="single">Single</option>
              <option value="married">Married</option>
            </select>
          </label>

          <label class="field">
            <span>Children</span>
            <input type="number" name="numberOfChildren" min="0" max="10" step="1" />
          </label>
        </div>

        <div class="field-row married-only-row">
          <label class="field">
            <span id="income-label">Taxable income (CHF/year)</span>
            <input type="number" name="income" min="0" step="1000" inputmode="numeric" />
          </label>

          <label class="field married-only" hidden title="Kept separate so we can preview individual/separate taxation.">
            <span>Spouse's income</span>
            <input type="number" name="spouseIncome" min="0" step="1000" inputmode="numeric" />
          </label>
        </div>

        <div class="field-row married-only-row">
          <label class="field">
            <span id="faith-label">Religion (for church tax)</span>
            <select name="faith">${faithOptions}</select>
          </label>

          <label class="field married-only" hidden title="Swiss church tax splits 50/50 between spouses of differing confessions, rather than using one shared household faith.">
            <span>Spouse's religion</span>
            <select name="spouseFaith">${faithOptions}</select>
          </label>
        </div>

        <label class="field">
          <span>Taxable wealth (CHF)</span>
          <input type="number" name="wealth" min="0" step="10000" inputmode="numeric" />
        </label>
      </fieldset>
    </form>
  `

  const form = container.querySelector('form')!
  const maritalSelect = form.elements.namedItem('maritalStatus') as HTMLSelectElement
  const childrenInput = form.elements.namedItem('numberOfChildren') as HTMLInputElement
  const faithSelect = form.elements.namedItem('faith') as HTMLSelectElement
  const spouseFaithSelect = form.elements.namedItem('spouseFaith') as HTMLSelectElement
  const incomeInput = form.elements.namedItem('income') as HTMLInputElement
  const spouseIncomeInput = form.elements.namedItem('spouseIncome') as HTMLInputElement
  const wealthInput = form.elements.namedItem('wealth') as HTMLInputElement
  const incomeLabel = form.querySelector('#income-label')!
  const faithLabel = form.querySelector('#faith-label')!
  const spouseFields = form.querySelectorAll<HTMLElement>('.married-only')

  maritalSelect.value = state.maritalStatus
  childrenInput.value = String(state.numberOfChildren)
  faithSelect.value = state.faith
  spouseFaithSelect.value = state.spouseFaith
  incomeInput.value = String(state.income)
  spouseIncomeInput.value = String(state.spouseIncome)
  wealthInput.value = String(state.wealth)
  syncMarriedUi()

  function syncMarriedUi() {
    const married = state.maritalStatus === 'married'
    spouseFields.forEach((el) => (el.hidden = !married))
    incomeLabel.textContent = married ? 'Your income' : 'Taxable income (CHF/year)'
    faithLabel.textContent = married ? 'Your religion' : 'Religion (for church tax)'
  }

  function emit() {
    options.onChange({ ...state })
  }

  maritalSelect.addEventListener('change', () => {
    state.maritalStatus = maritalSelect.value as MaritalStatus
    syncMarriedUi()
    emit()
  })
  childrenInput.addEventListener('input', () => {
    state.numberOfChildren = Math.max(0, Math.floor(Number(childrenInput.value) || 0))
    emit()
  })
  faithSelect.addEventListener('change', () => {
    state.faith = faithSelect.value as Faith
    emit()
  })
  spouseFaithSelect.addEventListener('change', () => {
    state.spouseFaith = spouseFaithSelect.value as Faith
    emit()
  })
  incomeInput.addEventListener('input', () => {
    state.income = Math.max(0, Number(incomeInput.value) || 0)
    emit()
  })
  spouseIncomeInput.addEventListener('input', () => {
    state.spouseIncome = Math.max(0, Number(spouseIncomeInput.value) || 0)
    emit()
  })
  wealthInput.addEventListener('input', () => {
    state.wealth = Math.max(0, Number(wealthInput.value) || 0)
    emit()
  })

  return {
    getState: () => ({ ...state }),
    setBfsNumber(bfsNumber: number | null) {
      state.bfsNumber = bfsNumber
    },
  }
}
