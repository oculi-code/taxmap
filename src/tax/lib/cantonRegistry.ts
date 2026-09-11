import type { CantonCode } from '../../types'
import { ag } from '../ch/ag/ag'
import { ai } from '../ch/ai/ai'
import { ar } from '../ch/ar/ar'
import { be } from '../ch/be/be'
import { bl } from '../ch/bl/bl'
import { bs } from '../ch/bs/bs'
import { fr } from '../ch/fr/fr'
import { ge } from '../ch/ge/ge'
import { gl } from '../ch/gl/gl'
import { gr } from '../ch/gr/gr'
import { ju } from '../ch/ju/ju'
import { lu } from '../ch/lu/lu'
import { ne } from '../ch/ne/ne'
import { nw } from '../ch/nw/nw'
import { ow } from '../ch/ow/ow'
import { sg } from '../ch/sg/sg'
import { sh } from '../ch/sh/sh'
import { so } from '../ch/so/so'
import { sz } from '../ch/sz/sz'
import { tg } from '../ch/tg/tg'
import { ti } from '../ch/ti/ti'
import { ur } from '../ch/ur/ur'
import { vd } from '../ch/vd/vd'
import { vs } from '../ch/vs/vs'
import { zg } from '../ch/zg/zg'
import { zh } from '../ch/zh/zh'
import type { CantonTaxModule } from './cantonModule'

const registry: Partial<Record<CantonCode, CantonTaxModule>> = {
  ZH: zh,
  SZ: sz,
  VS: vs,
  AG: ag,
  JU: ju,
  GR: gr,
  VD: vd,
  SO: so,
  NE: ne,
  GL: gl,
  ZG: zg,
  BE: be,
  LU: lu,
  TI: ti,
  GE: ge,
  SG: sg,
  TG: tg,
  BS: bs,
  BL: bl,
  UR: ur,
  OW: ow,
  NW: nw,
  AI: ai,
  SH: sh,
  AR: ar,
  FR: fr,
}

export function getCantonModule(code: CantonCode): CantonTaxModule | null {
  return registry[code] ?? null
}

/** Cantons with a dedicated module (src/tax/ch/<code>/) — every other canton
 * falls back to the generic approximate model (see lib/generic.ts). */
export const PRECISE_CANTONS: ReadonlySet<CantonCode> = new Set(Object.keys(registry) as CantonCode[])
