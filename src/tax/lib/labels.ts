import { t } from '../../i18n/translations'
import type { ChurchSplitPart } from './churchSplit'

function ownerPrefix(part: ChurchSplitPart): string {
  return part.owner === 'you' ? t('churchOwnerYou') : part.owner === 'spouse' ? t('churchOwnerSpouse') : ''
}

function faithShort(faith: ChurchSplitPart['faith']): string {
  return faith === 'reformed' ? t('faithReformedShort') : t('faithCatholicShort')
}

export function federalTaxLabel(): string {
  return t('labelFederalTax')
}

export function cantonalTaxLabel(code: string): string {
  return t('labelCantonalTax', { code })
}

export function cantonalIncomeTaxLabel(code: string): string {
  return t('labelCantonalIncomeTax', { code })
}

export function cantonalWealthTaxLabel(code: string): string {
  return t('labelCantonalWealthTax', { code })
}

export function municipalTaxLabel(name: string): string {
  return t('labelMunicipalTax', { name })
}

export function municipalTaxInclSchoolLabel(name: string): string {
  return t('labelMunicipalTaxInclSchool', { name })
}

export function municipalIncomeTaxLabel(name: string): string {
  return t('labelMunicipalIncomeTax', { name })
}

export function municipalWealthTaxLabel(name: string): string {
  return t('labelMunicipalWealthTax', { name })
}

export function districtTaxLabel(district: string): string {
  return t('labelDistrictTax', { district })
}

export function churchTaxLabel(part: ChurchSplitPart): string {
  return t('labelChurchTax', { owner: ownerPrefix(part), faith: faithShort(part.faith) })
}

export function churchTaxIncomeOnlyLabel(part: ChurchSplitPart): string {
  return t('labelChurchTaxIncomeOnly', { owner: ownerPrefix(part), faith: faithShort(part.faith) })
}

export function churchIncomeTaxLabel(part: ChurchSplitPart): string {
  return t('labelChurchIncomeTax', { owner: ownerPrefix(part), faith: faithShort(part.faith) })
}

export function churchWealthTaxLabel(part: ChurchSplitPart): string {
  return t('labelChurchWealthTax', { owner: ownerPrefix(part), faith: faithShort(part.faith) })
}

export function churchTaxReformedLandeskircheLabel(part: ChurchSplitPart): string {
  return t('labelChurchTaxReformedLandeskirche', { owner: ownerPrefix(part) })
}

export function supplementaryWealthTaxLabel(code: string): string {
  return t('labelSupplementaryWealthTax', { code })
}

export function genericApproxLabel(): string {
  return t('labelGenericApprox')
}

export function childDeductionLabel(n: number): string {
  return t('labelChildDeduction', { n: String(n) })
}

export function insurancePremiumDeductionLabel(): string {
  return t('labelInsurancePremiumDeduction')
}

export function insuranceDeductionPerChildLabel(n: number): string {
  return t('labelInsuranceDeductionPerChild', { n: String(n) })
}

export function marriedCoupleDeductionLabel(): string {
  return t('labelMarriedCoupleDeduction')
}

export function twoEarnerDeductionLabel(): string {
  return t('labelTwoEarnerDeduction')
}

export function parentTaxCreditLabel(n: number): string {
  return t('labelParentTaxCredit', { n: String(n) })
}
