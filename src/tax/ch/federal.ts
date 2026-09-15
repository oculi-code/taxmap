import type { DeductionLine, TaxInput } from '../../types'
import { taxFromBrackets } from '../lib/bracket'
import {
  childDeductionLabel,
  insuranceDeductionPerChildLabel,
  insurancePremiumDeductionLabel,
  marriedCoupleDeductionLabel,
  parentTaxCreditLabel,
  twoEarnerDeductionLabel,
} from '../lib/labels'
import federal from './federal.data.json'

export interface FederalComputation {
  grossIncome: number
  deductions: DeductionLine[]
  credits: DeductionLine[]
  taxableIncome: number
  tax: number
}

/** Computes taxable income (gross income minus the standard federal deductions)
 * and the federal tax owed on it. Per product decision, the same deduction
 * amounts/rules are reused as the deduction basis for cantonal tax too (real
 * cantonal deduction schedules differ, but showing which deductions were
 * applied matters more here than modeling all 26 cantons' own amounts). */
export function computeFederalIncomeTax(input: TaxInput): FederalComputation {
  const grossIncome = input.income + (input.maritalStatus === 'married' ? input.spouseIncome : 0)
  const deductions: DeductionLine[] = []

  if (input.numberOfChildren > 0) {
    deductions.push({
      label: childDeductionLabel(input.numberOfChildren),
      amount: federal.deductions.childDeduction * input.numberOfChildren,
    })
  }

  const insuranceBase =
    input.maritalStatus === 'married' ? federal.deductions.insuranceDeductionMarried : federal.deductions.insuranceDeductionSingle
  deductions.push({ label: insurancePremiumDeductionLabel(), amount: insuranceBase })

  if (input.numberOfChildren > 0) {
    deductions.push({
      label: insuranceDeductionPerChildLabel(input.numberOfChildren),
      amount: federal.deductions.insuranceDeductionPerChild * input.numberOfChildren,
    })
  }

  if (input.maritalStatus === 'married') {
    deductions.push({ label: marriedCoupleDeductionLabel(), amount: federal.deductions.marriedDeduction })
  }

  if (input.maritalStatus === 'married' && input.spouseIncome > 0) {
    const lower = Math.min(input.income, input.spouseIncome)
    const { percentOfLowerIncome, min, max } = federal.deductions.twoEarnerDeduction
    const amount = Math.min(max, Math.max(min, lower * percentOfLowerIncome))
    deductions.push({ label: twoEarnerDeductionLabel(), amount })
  }

  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0)
  const taxableIncome = Math.max(0, grossIncome - totalDeductions)

  // Married couples, and single parents supporting children, are taxed on the
  // more favorable "parent/married" rate schedule (Elterntarif/Verheiratetentarif).
  const usesParentTariff = input.maritalStatus === 'married' || input.numberOfChildren > 0
  const brackets = usesParentTariff ? federal.incomeTax.married : federal.incomeTax.single
  const grossTax = taxFromBrackets(taxableIncome, brackets)

  const credits: DeductionLine[] = []
  if (usesParentTariff && input.numberOfChildren > 0) {
    credits.push({
      label: parentTaxCreditLabel(input.numberOfChildren),
      amount: federal.deductions.parentTaxCreditPerChild * input.numberOfChildren,
    })
  }
  const totalCredits = credits.reduce((sum, c) => sum + c.amount, 0)
  const tax = Math.max(0, grossTax - totalCredits)

  return { grossIncome, deductions, credits, taxableIncome, tax }
}
