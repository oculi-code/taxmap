// One-time migration: transforms data/raw/*.json (the immutable research
// archive — do not edit) into the colocated per-canton data files under
// src/tax/ch/<code>/, which are what the app actually imports. Field names
// are simplified to bake in each canton's known unit convention (Percent /
// Factor / Rate suffixes) since that's now encoded in each canton's own
// compute function rather than carried around as a generic "unit" flag.
//
// Re-run this if data/raw/ is ever updated with a newer tax year — it's not
// part of the regular build.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(fileURLToPath(import.meta.url)) + '/..'
const raw = (name) => JSON.parse(readFileSync(`${root}/data/raw/${name}.json`, 'utf8'))
const write = (relPath, data) => writeFileSync(`${root}/${relPath}`, JSON.stringify(data, null, 2) + '\n')

// --- federal ---
{
  const f = raw('federal')
  write('src/tax/ch/federal.data.json', {
    year: f.year,
    incomeTax: f.incomeTaxBrackets,
    deductions: {
      childDeduction: f.deductions.childDeduction,
      insuranceDeductionSingle: f.deductions.insuranceDeductionSingle,
      insuranceDeductionMarried: f.deductions.insuranceDeductionMarried,
      insuranceDeductionPerChild: f.deductions.insuranceDeductionPerChild,
      marriedDeduction: f.deductions.marriedDeduction,
      parentTaxCreditPerChild: f.deductions.parentTaxCreditPerChild,
      twoEarnerDeduction: f.deductions.twoEarnerDeduction,
    },
  })
}

// --- ZH: 3 layers (cantonal / municipal / church), all percent-of-simple-tax, wealth splits single/married ---
{
  const c = raw('ZH')
  const m = raw('ZH_municipalities')
  write('src/tax/ch/zh/zh.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets,
    wealthTax: { single: c.wealthTaxBrackets.single, married: c.wealthTaxBrackets.married },
    cantonalMultiplierPercent: c.cantonalMultiplier.value,
  })
  write(
    'src/tax/ch/zh/zh.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      district: r.district,
      municipalMultiplierPercent: r.municipalMultiplier,
      churchMultiplierReformedPercent: r.churchMultiplierReformed,
      churchMultiplierCatholicPercent: r.churchMultiplierCatholic,
    })),
  )
}

// --- SZ: 4 real layers (cantonal w/ §36a surcharge quirk / district / municipal / church) ---
// The archived Steuerfusstabelle PDF's "Details" table gives Bezirk and
// Gemeinde separately; data/raw/SZ_municipalities.json had pre-combined them
// (documented there as a schema limitation at the time). Values below were
// re-derived from data/raw/sources/SZ_Steuerfusstabelle_2026.pdf and verified
// to sum to the old combined figure for all 30 municipalities.
{
  const c = raw('SZ')
  const m = raw('SZ_municipalities')
  const districtGemeindeByBfs = {
    1301: [170, 0], // Einsiedeln (Bezirk rate covers the municipality directly)
    1311: [145, 0], // Gersau
    1321: [14, 55], // Feusisberg
    1322: [14, 50], // Freienbach
    1323: [14, 50], // Wollerau
    1331: [145, 0], // Küssnacht
    1341: [30, 85], // Altendorf
    1342: [30, 125], // Galgenen
    1343: [30, 110], // Innerthal
    1344: [30, 95], // Lachen
    1345: [30, 150], // Reichenburg
    1346: [30, 150], // Schübelbach
    1347: [30, 124], // Tuggen
    1348: [30, 135], // Vorderthal
    1349: [30, 135], // Wangen
    1361: [35, 120], // Alpthal
    1362: [35, 110], // Arth
    1363: [35, 160], // Illgau
    1364: [35, 130], // Ingenbohl
    1365: [35, 140], // Lauerz
    1366: [35, 130], // Morschach
    1367: [35, 115], // Muotathal
    1368: [35, 90], // Oberiberg
    1369: [35, 100], // Riemenstalden
    1370: [35, 120], // Rothenthurm
    1371: [35, 120], // Sattel
    1372: [35, 140], // Schwyz
    1373: [35, 160], // Steinen
    1374: [35, 120], // Steinerberg
    1375: [35, 120], // Unteriberg
  }
  for (const r of m) {
    const [bezirk, gemeinde] = districtGemeindeByBfs[r.bfsNumber]
    if (bezirk + gemeinde !== r.municipalMultiplier) {
      throw new Error(`SZ district+municipal split mismatch for ${r.name}: ${bezirk}+${gemeinde} != ${r.municipalMultiplier}`)
    }
  }

  write('src/tax/ch/sz/sz.data.json', {
    year: c.year,
    // SZ has no separately-published married tariff — § 36 Abs. 2 StG uses a
    // rate-determining divisor instead (see splittingDivisor below), so only
    // the single-filer schedules are stored; sz.ts derives married brackets
    // at runtime via scaleBracketsForSplitting.
    incomeTaxSingle: c.incomeTaxBrackets.single,
    // §36a surcharge schedule: used ONLY for the cantonal component above
    // CHF 258'800 (single) / the divisor-scaled equivalent (married).
    cantonalOnlyIncomeTaxSingle: c.cantonalOnlyIncomeTaxBrackets.single,
    splittingDivisor: c.splittingDivisor,
    wealthTax: c.wealthTaxBrackets.general,
    cantonalMultiplierPercent: c.cantonalMultiplier.value,
  })
  write(
    'src/tax/ch/sz/sz.municipalities.json',
    m.map((r) => {
      const [districtMultiplierPercent, municipalMultiplierPercent] = districtGemeindeByBfs[r.bfsNumber]
      return {
        bfsNumber: r.bfsNumber,
        name: r.name,
        district: r.district,
        districtMultiplierPercent,
        municipalMultiplierPercent,
        churchMultiplierReformedPercent: r.churchMultiplierReformed,
        churchMultiplierCatholicPercent: r.churchMultiplierCatholic,
      }
    }),
  )
}

// --- VS: no cantonal multiplier (brackets already are the full cantonal tax); municipal is a factor; no church data ---
{
  const c = raw('VS')
  const m = raw('VS_municipalities')
  write('src/tax/ch/vs/vs.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets,
    wealthTax: c.wealthTaxBrackets.general,
  })
  write(
    'src/tax/ch/vs/vs.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      district: r.district,
      municipalMultiplierFactor: r.municipalMultiplier,
    })),
  )
}

// --- AG: 3 layers (cantonal / municipal / church incl. christ-catholic), all percent ---
{
  const c = raw('AG')
  const m = raw('AG_municipalities')
  write('src/tax/ch/ag/ag.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets,
    wealthTax: c.wealthTaxBrackets.general,
    cantonalMultiplierPercent: c.cantonalMultiplier.value,
  })
  write(
    'src/tax/ch/ag/ag.municipalities.json',
    m
      .filter((r) => r.bfsNumber != null)
      .map((r) => ({
        bfsNumber: r.bfsNumber,
        name: r.name,
        district: r.district,
        municipalMultiplierPercent: r.municipalMultiplier,
        churchMultiplierReformedPercent: r.churchMultiplierReformed,
        churchMultiplierCatholicPercent: r.churchMultiplierCatholic,
        churchMultiplierChristCatholicPercent: r.churchMultiplierChristCatholic ?? null,
      })),
  )
}

// --- JU: cantonal multiplier is a factor; wealth has a cliff exemption; church tax applies to the POST-multiplier cantonal tax ---
{
  const c = raw('JU')
  const m = raw('JU_municipalities')
  write('src/tax/ch/ju/ju.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets,
    wealthTax: c.wealthTaxBrackets.general,
    wealthExemptionThreshold: c.wealthTaxExemptionThreshold,
    cantonalMultiplierFactor: c.cantonalMultiplier.value,
    churchReformedRate: c.churchTax.reformed,
  })
  write(
    'src/tax/ch/ju/ju.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      district: r.district,
      municipalMultiplierFactor: r.municipalMultiplier,
      municipalMultiplierEstimated: r.municipalMultiplierEstimated ?? false,
      churchMultiplierReformedRate: r.churchMultiplierReformed,
      churchMultiplierCatholicRate: r.churchMultiplierCatholic,
      churchMultiplierCatholicEstimated: r.churchMultiplierCatholicEstimated ?? false,
    })),
  )
}

// --- GR: 3 layers, cantonal multiplier percent; reformed church tax is local
// parish rate + a uniform 3.5% cantonal Landeskirche layer (catholic has no
// such cantonal layer); wealth tax shares one schedule for all filers ---
{
  const c = raw('GR')
  const m = raw('GR_municipalities')
  write('src/tax/ch/gr/gr.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets,
    wealthTax: c.wealthTaxBrackets.general,
    cantonalMultiplierPercent: c.cantonalMultiplier.value,
    churchReformedCantonalPercent: c.churchTax.reformed,
  })
  write(
    'src/tax/ch/gr/gr.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      district: r.district,
      municipalMultiplierPercent: r.municipalMultiplier,
      churchMultiplierReformedLocalPercent: r.churchMultiplierReformed,
      churchMultiplierCatholicPercent: r.churchMultiplierCatholic,
    })),
  )
}

// --- VD: cantonal (155%) and communal multipliers apply independently to the
// same base tax, but a 2026-specific 5% rebate applies ONLY to the cantonal
// share. No church tax at all (state-funded, confirmed not a data gap). ---
{
  const c = raw('VD')
  const m = raw('VD_municipalities')
  write('src/tax/ch/vd/vd.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets,
    wealthTax: c.wealthTaxBrackets.general,
    cantonalMultiplierPercent: c.cantonalMultiplier.value,
    cantonalOnlyRebatePercent: 5, // Art. 4 LRIPP, fiscal year 2026 only
  })
  write(
    'src/tax/ch/vd/vd.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      district: r.district,
      municipalMultiplierPercent: r.municipalMultiplier,
    })),
  )
}

// --- SO: 3 layers, all percent, straightforward (like ZH/AG) — includes an
// optional christ-catholic church rate not present in every municipality ---
{
  const c = raw('SO')
  const m = raw('SO_municipalities')
  write('src/tax/ch/so/so.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets,
    wealthTax: c.wealthTaxBrackets.general,
    cantonalMultiplierPercent: c.cantonalMultiplier.value,
  })
  write(
    'src/tax/ch/so/so.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      district: r.district,
      municipalMultiplierPercent: r.municipalMultiplier,
      churchMultiplierReformedPercent: r.churchMultiplierReformed,
      churchMultiplierCatholicPercent: r.churchMultiplierCatholic,
      churchMultiplierChristCatholicPercent: r.churchMultiplierChristCatholic ?? null,
    })),
  )
}

// --- NE: cantonal (124%) + municipal, no church tax at all (it's a purely
// voluntary contribution collected outside the tax system, unlike every
// other modeled canton) — married brackets (income AND wealth) are already
// pre-scaled by the agent from NE's underlying "52%-of-income" rate lookup. ---
{
  const c = raw('NE')
  const m = raw('NE_municipalities')
  write('src/tax/ch/ne/ne.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets,
    wealthTax: { single: c.wealthTaxBrackets.general, married: c.wealthTaxBrackets.married },
    cantonalMultiplierPercent: c.cantonalMultiplier.value,
  })
  write(
    'src/tax/ch/ne/ne.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      district: r.district,
      municipalMultiplierPercent: r.municipalMultiplier,
    })),
  )
}

// --- GL: cantonal + municipal only (no confirmed church data — canton's own
// comparison PDF was a dead link at research time, left unmodeled rather than
// guessed). Cantonal multiplier folds in the earmarked "Bausteuerzuschlag"
// (58% ordinary + 1.7% infrastructure surcharge = 59.7%, both billed
// identically as % of simple tax); municipal multipliers already have their
// own such surcharges baked in by the source. Wealth tax is a flat rate. ---
{
  const c = raw('GL')
  const m = raw('GL_municipalities')
  write('src/tax/ch/gl/gl.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets,
    wealthTax: c.wealthTaxBrackets.general,
    cantonalMultiplierPercent: c.cantonalMultiplier.value + 1.7,
  })
  write(
    'src/tax/ch/gl/gl.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      municipalMultiplierPercent: r.municipalMultiplier,
    })),
  )
}

// --- ZG: 3 layers, all percent. Reformed church is a uniform canton-wide 6%
// (already the same value on every municipality row, so no special-casing
// needed — treated identically to catholic's per-municipality lookup). A
// narrow 4th layer (Bürgergemeinden, taxing only citizens with local
// Bürgerrecht) exists but isn't modeled — out of scope for this app's inputs. ---
{
  const c = raw('ZG')
  const m = raw('ZG_municipalities')
  write('src/tax/ch/zg/zg.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets,
    wealthTax: c.wealthTaxBrackets.general,
    cantonalMultiplierPercent: c.cantonalMultiplier.value,
  })
  write(
    'src/tax/ch/zg/zg.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      municipalMultiplierPercent: r.municipalMultiplier,
      churchMultiplierReformedPercent: r.churchMultiplierReformed,
      churchMultiplierCatholicPercent: r.churchMultiplierCatholic,
    })),
  )
}

// --- BE: 3 layers, all percent (converted from the official "Vielfaches"
// factor, e.g. 2.975 -> 297.5%, per this project's GR/SO precedent). Wealth
// tax has a genuine cliff exemption below CHF 100'000 (Art. 65 Abs. 3 StG) —
// distinct from, and overriding, the bracket table's own 0% first band. ---
{
  const c = raw('BE')
  const m = raw('BE_municipalities')
  write('src/tax/ch/be/be.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets,
    wealthTax: c.wealthTaxBrackets.general,
    wealthTaxExemptionThreshold: 100000,
    cantonalMultiplierPercent: c.cantonalMultiplier.value,
  })
  write(
    'src/tax/ch/be/be.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      district: r.district,
      municipalMultiplierPercent: r.municipalMultiplier,
      churchMultiplierReformedPercent: r.churchMultiplierReformed,
      churchMultiplierCatholicPercent: r.churchMultiplierCatholic,
      churchMultiplierChristCatholicPercent: r.churchMultiplierChristCatholic ?? null,
    })),
  )
}

// --- LU: 3 layers, all percent. Wealth tax is a genuine flat rate (one
// bracket, like SZ/GL) — no brackets at all. ---
{
  const c = raw('LU')
  const m = raw('LU_municipalities')
  write('src/tax/ch/lu/lu.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets,
    wealthTax: c.wealthTaxBrackets.general,
    cantonalMultiplierPercent: c.cantonalMultiplier.value,
  })
  write(
    'src/tax/ch/lu/lu.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      district: r.district,
      municipalMultiplierPercent: r.municipalMultiplier,
      churchMultiplierReformedPercent: r.churchMultiplierReformed,
      churchMultiplierCatholicPercent: r.churchMultiplierCatholic,
      churchMultiplierChristCatholicPercent: r.churchMultiplierChristCatholic ?? null,
    })),
  )
}

// --- TI: 2 layers (cantonal, currently 100% — effectively pass-through —
// plus municipal). No confirmed church data: TI's "imposta di culto" is
// levied per-parish (not per-municipality), highly heterogeneous, no
// canton-wide table exists. Both bracket tables have genuine non-monotonic
// marginal-rate humps (verified against source, not errors) — no special
// handling needed, taxFromBrackets already produces correct cumulative tax
// as long as no rate is negative. ---
{
  const c = raw('TI')
  const m = raw('TI_municipalities')
  write('src/tax/ch/ti/ti.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets,
    wealthTax: c.wealthTaxBrackets.general,
    cantonalMultiplierPercent: c.cantonalMultiplier.value,
  })
  write(
    'src/tax/ch/ti/ti.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      district: r.district,
      municipalMultiplierPercent: r.municipalMultiplier,
    })),
  )
}

// --- GE: cantonal (148.5%) and municipal multipliers apply independently to
// income and wealth base tax, but a 12% rebate applies ONLY to the cantonal
// INCOME share (not wealth, not municipal) — a different asymmetry axis than
// Vaud's (which discounted the whole cantonal share, not just income). Wealth
// also has a second bracket layer ("impôt supplémentaire") immune to ANY
// multiplier at all. No church tax (laïcité law — confirmed, not a gap). ---
{
  const c = raw('GE')
  const m = raw('GE_municipalities')
  write('src/tax/ch/ge/ge.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets,
    wealthTax: c.wealthTaxBrackets.general,
    wealthTaxSupplementary: c.wealthTaxBrackets.supplementaryNoMultiplier,
    cantonalMultiplierPercent: c.cantonalMultiplier.value,
    cantonalIncomeRebatePercent: 12,
  })
  write(
    'src/tax/ch/ge/ge.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      municipalMultiplierPercent: r.municipalMultiplier,
    })),
  )
}

// --- SG: 3 layers, all percent. Wealth tax is a flat rate. One municipality
// (Wil, BFS 3427) has a genuinely undecided 2026 multiplier pending a
// referendum — uses a flagged estimate (see errata in SG.json's notes)
// rather than silently showing no municipal/church tax at all. ---
{
  const c = raw('SG')
  const m = raw('SG_municipalities')
  write('src/tax/ch/sg/sg.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets,
    wealthTax: c.wealthTaxBrackets.general,
    cantonalMultiplierPercent: c.cantonalMultiplier.value,
  })
  write(
    'src/tax/ch/sg/sg.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      district: r.district,
      municipalMultiplierPercent: r.municipalMultiplier,
      municipalMultiplierEstimated: r.municipalMultiplierEstimated ?? false,
      churchMultiplierReformedPercent: r.churchMultiplierReformed,
      churchMultiplierCatholicPercent: r.churchMultiplierCatholic,
      churchMultiplierEstimated: r.churchMultiplierEstimated ?? false,
    })),
  )
}

// --- TG: nominally 4 layers (Staat + Gemeinde + Schule + Kirche), but
// Gemeinde+Schule are pre-combined into one municipalMultiplier figure
// (following this project's SZ precedent — the school/church boundary data
// was too irregular to cleanly split, unlike SZ's clean Bezirk table). ---
{
  const c = raw('TG')
  const m = raw('TG_municipalities')
  write('src/tax/ch/tg/tg.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets,
    wealthTax: c.wealthTaxBrackets.general,
    cantonalMultiplierPercent: c.cantonalMultiplier.value,
  })
  write(
    'src/tax/ch/tg/tg.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      district: r.district,
      municipalMultiplierPercent: r.municipalMultiplier,
      churchMultiplierReformedPercent: r.churchMultiplierReformed,
      churchMultiplierCatholicPercent: r.churchMultiplierCatholic,
    })),
  )
}

// --- BS: no standard cantonal-multiplier concept at all — the bracket table
// itself IS the tax (appliedOnTop=false), and the cantonal/municipal SPLIT
// itself varies by municipality (Basel: 100%/0%, Riehen/Bettingen: 50% canton
// + their own separately-set income and wealth municipal shares) — so, unlike
// every other canton, both shares live per-municipality, not as a canton-wide
// constant. Church tax applies to income only, never wealth. Wealth tax has
// its own single/married split (not a shared "general" schedule). ---
{
  const c = raw('BS')
  const m = raw('BS_municipalities')
  write('src/tax/ch/bs/bs.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets,
    wealthTax: { single: c.wealthTaxBrackets.single, married: c.wealthTaxBrackets.married },
  })
  write(
    'src/tax/ch/bs/bs.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      cantonalShareIncomePercent: r.cantonalShareIncomePercent,
      cantonalShareWealthPercent: r.cantonalShareWealthPercent,
      municipalShareIncomePercent: r.municipalMultiplierIncomePercent,
      municipalShareWealthPercent: r.municipalMultiplierWealthPercent,
      churchMultiplierReformedPercent: r.churchMultiplierReformed,
      churchMultiplierCatholicPercent: r.churchMultiplierCatholic,
    })),
  )
}

// --- BL: cantonal multiplier applies to income only (95-105% band, currently
// 100%) — wealth tax has NO cantonal multiplier step at all, its bracket
// result is final. Municipal layer is one combined Steuerfuss applied to
// both income and wealth base identically. No confirmed church data
// (no consolidated per-Kirchgemeinde dataset found). ---
{
  const c = raw('BL')
  const m = raw('BL_municipalities')
  write('src/tax/ch/bl/bl.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets,
    wealthTax: c.wealthTaxBrackets.general,
    cantonalIncomeMultiplierPercent: c.cantonalMultiplier.value,
  })
  write(
    'src/tax/ch/bl/bl.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      municipalMultiplierPercent: r.municipalMultiplier,
    })),
  )
}

// --- UR: genuinely flat-rate (no brackets) at all three layers, each with
// its OWN "einfache Steuer" base rate before its own Steuerfuss: cantonal and
// municipal both use 7.1% income / 1.0‰ wealth (identical base, only the
// Steuerfuss differs), while church uses a distinct, lower 1% income / 0.3‰
// wealth base (Art. 1389/1390 area of the Kantonsblatt; not present as a
// field in UR.json — taken from the researched notes). Reformed church is a
// uniform 115% canton-wide rate (4 sub-municipal exception parishes exist
// but are below BFS-municipality granularity, not modeled); catholic varies
// per municipality. Kopfsteuer and the separate lump-sum-pension schedule are
// out of scope (not ordinary income/wealth tax). ---
{
  const c = raw('UR')
  const m = raw('UR_municipalities')
  write('src/tax/ch/ur/ur.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets.single,
    wealthTax: c.wealthTaxBrackets.general,
    churchIncomeTax: [{ from: 0, rate: 0.01 }],
    churchWealthTax: [{ from: 0, rate: 0.0003 }],
    cantonalMultiplierPercent: c.cantonalMultiplier.value,
    churchMultiplierReformedPercent: c.churchTax.reformed,
  })
  write(
    'src/tax/ch/ur/ur.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      municipalMultiplierPercent: r.municipalMultiplier,
      churchMultiplierCatholicPercent: r.churchMultiplierCatholic,
    })),
  )
}

// --- OW: genuinely flat-rate (no brackets), like UR, but the Steuerfuss is
// expressed in raw "Einheiten" (a factor used directly, NOT a percent) at
// every layer, and several municipalities stack an earmarked special-purpose
// levy directly into their headline municipal Einheiten figure (already
// folded into OW_municipalities.json's municipalMultiplier per the research
// notes). Reformed church is a flat 0.54 Einheiten canton-wide EXCEPT
// Engelberg, which is outside the cantonal Reformed Kirchgemeinde and shows
// no church-tax line at all (both fields null — confirmed zero, not a
// research gap). Catholic varies per municipality. ---
{
  const c = raw('OW')
  const m = raw('OW_municipalities')
  write('src/tax/ch/ow/ow.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets.single,
    wealthTax: c.wealthTaxBrackets.general,
    cantonalMultiplierFactor: c.cantonalMultiplier.value,
    churchMultiplierReformedFactor: c.churchTax.reformed,
  })
  write(
    'src/tax/ch/ow/ow.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      municipalMultiplierFactor: r.municipalMultiplier,
      churchMultiplierReformedFactor: r.churchMultiplierReformed,
      churchMultiplierCatholicFactor: r.churchMultiplierCatholic,
    })),
  )
}

// --- NW: genuine 18-step progressive schedule, but for income >= CHF 166'300
// (single) / 307'655 (married, = 166300*1.85 splitting divisor) the ENTIRE
// income is taxed at a flat average 2.75% — lower than the 3.3% marginal
// rate just below, a deliberate regressive "rate cap" that is NOT a seamless
// continuation of the marginal table (verified by the research agent: the
// cumulative marginal tax at the boundary is close to but not exactly
// 0.0275*166300, confirming a real discontinuity from independent rounding
// of CHF-100 thresholds). The cap entry is therefore stripped from the
// bracket array and handled as a separate flat rule in nw.ts. Cantonal
// multiplier is a factor (Einheiten) applying identically to income+wealth;
// reformed church is a uniform 0.26 canton-wide, catholic varies. ---
{
  const c = raw('NW')
  const m = raw('NW_municipalities')
  write('src/tax/ch/nw/nw.data.json', {
    year: c.year,
    incomeTax: {
      single: c.incomeTaxBrackets.single.slice(0, -1),
      married: c.incomeTaxBrackets.married.slice(0, -1),
    },
    incomeTaxCapThreshold: {
      single: c.incomeTaxBrackets.single.at(-1).from,
      married: c.incomeTaxBrackets.married.at(-1).from,
    },
    incomeTaxCapRate: c.incomeTaxBrackets.single.at(-1).rate,
    wealthTax: c.wealthTaxBrackets.general,
    cantonalMultiplierFactor: c.cantonalMultiplier.value,
    churchMultiplierReformedFactor: c.churchTax.reformed,
  })
  write(
    'src/tax/ch/nw/nw.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      municipalMultiplierFactor: r.municipalMultiplier,
      churchMultiplierCatholicFactor: r.churchMultiplierCatholic,
    })),
  )
}

// --- AI: Bezirke (not "Gemeinden") are the lowest administrative unit and
// serve as this app's municipality-equivalent layer — only 5 since the 2022
// Schwende/Rüte merger. Income tax also has a top-end average-rate cap
// (>=CHF 200'000 flat 8%) like NW's, but here it's exactly mathematically
// continuous with the marginal schedule at the boundary (verified to the
// franc), so it needs NO special-casing — the bracket array already
// includes it as an ordinary final entry. Church tax is patchy: reformed
// parishes are mostly out-of-canton and only Appenzell has a value; one
// Bezirk (Schlatt-Haslen) has no confirmed catholic rate either — both left
// null in the source data, which the shared null-guard pattern handles. ---
{
  const c = raw('AI')
  const m = raw('AI_municipalities')
  write('src/tax/ch/ai/ai.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets,
    wealthTax: c.wealthTaxBrackets.general,
    cantonalMultiplierPercent: c.cantonalMultiplier.value,
  })
  write(
    'src/tax/ch/ai/ai.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      municipalMultiplierPercent: r.municipalMultiplier,
      churchMultiplierReformedPercent: r.churchMultiplierReformed,
      churchMultiplierCatholicPercent: r.churchMultiplierCatholic,
    })),
  )
}

// --- SH: 3 layers, all percent, straightforward (like ZH/AG/SO) — both the
// income and wealth top brackets are drafted in law as a flat "uniform rate"
// above their threshold, but verified numerically identical to the
// continued marginal schedule, so no special-casing needed (contrast NW).
// Historical Bezirke were abolished as an administrative/tax layer, so
// district is null throughout. Data year is 2025 (last year with a complete
// official municipal table; 2026's cantonal rate is known but not the full
// municipal breakdown — see notes for why). ---
{
  const c = raw('SH')
  const m = raw('SH_municipalities')
  write('src/tax/ch/sh/sh.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets,
    wealthTax: c.wealthTaxBrackets.general,
    cantonalMultiplierPercent: c.cantonalMultiplier.value,
  })
  write(
    'src/tax/ch/sh/sh.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      municipalMultiplierPercent: r.municipalMultiplier,
      churchMultiplierReformedPercent: r.churchMultiplierReformed,
      churchMultiplierCatholicPercent: r.churchMultiplierCatholic,
    })),
  )
}

// --- AR: 3 layers, but the Steuerfuss is a raw "Einheiten" factor (like
// NW/OW), not a percent — applied directly, no /100. Genuinely separate
// married/single bracket tables (no splitting divisor, unlike SH). Top
// income bracket is a real regressive tail (2.60% flat, below the preceding
// 2.90% marginal band) — verified numerically continuous at the boundary,
// so still just an ordinary final bracket entry, no special-casing needed
// (contrast NW, where the equivalent trick does NOT reconcile exactly). ---
{
  const c = raw('AR')
  const m = raw('AR_municipalities')
  write('src/tax/ch/ar/ar.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets,
    wealthTax: c.wealthTaxBrackets.general,
    cantonalMultiplierFactor: c.cantonalMultiplier.value,
  })
  write(
    'src/tax/ch/ar/ar.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      district: r.district,
      municipalMultiplierFactor: r.municipalMultiplier,
      churchMultiplierReformedFactor: r.churchMultiplierReformed,
      churchMultiplierCatholicFactor: r.churchMultiplierCatholic,
    })),
  )
}

// --- FR: three INDEPENDENT layers on one shared base, each applied
// separately to the income base and the wealth base (not combined like
// most cantons) — cantonal coefficient differs by tax type this year (96%
// income / 100% wealth, set independently by law each year, so both are
// stored as their own constant rather than one shared multiplier); communal
// coefficient is legally required to be identical for income/wealth (so one
// combined-base component, like BL's municipal layer); parish (church)
// coefficient has NO such equality requirement and often differs a lot
// between income and wealth for the same parish, so it needs its own two
// fields. incomeTaxBrackets is a piecewise-constant approximation of FR's
// true formula/average-rate schedule (same family as VS/NE elsewhere in
// this project), derived by the research agent from the canton's own
// per-CHF-100 official lookup table — good to within ~CHF 25 (well under
// 0.1% of tax owed). Municipal multiplier uses a flagged estimate for one
// 2025-merger commune (Fétigny-Ménières) not yet in the coefficients
// dataset (see errata in FR.json's notes), and church coefficients are
// null wherever a commune is covered by multiple disagreeing parishes (no
// single rate exists without address-level data) — those are left null and
// skipped gracefully, since no defensible single estimate exists there. ---
{
  const c = raw('FR')
  const m = raw('FR_municipalities')
  write('src/tax/ch/fr/fr.data.json', {
    year: c.year,
    incomeTax: c.incomeTaxBrackets,
    wealthTax: c.wealthTaxBrackets.general,
    cantonalIncomeMultiplierPercent: c.cantonalMultiplier.value,
    // Wealth coefficient annuel is set independently (Art. 1 al. 2 LCA2026);
    // 100% for 2026 means the wealth bracket table is already the final
    // effective rate this year — see cantonalMultiplier.note in FR.json.
    cantonalWealthMultiplierPercent: 100,
  })
  write(
    'src/tax/ch/fr/fr.municipalities.json',
    m.map((r) => ({
      bfsNumber: r.bfsNumber,
      name: r.name,
      district: r.district,
      municipalMultiplierPercent: r.municipalMultiplier,
      municipalMultiplierEstimated: r.municipalMultiplierEstimated ?? false,
      churchMultiplierReformedPercent: r.churchMultiplierReformed,
      churchMultiplierReformedWealthPercent: r.churchMultiplierReformedWealth,
      churchMultiplierCatholicPercent: r.churchMultiplierCatholic,
      churchMultiplierCatholicWealthPercent: r.churchMultiplierCatholicWealth,
    })),
  )
}

console.log('Migrated data/raw/*.json -> src/tax/ch/**/*.json')
