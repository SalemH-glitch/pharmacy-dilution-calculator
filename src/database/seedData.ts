/**
 * seedData.ts
 *
 * All reference data for diluents and common pediatric/NICU drugs.
 * Concentrations and safety limits reflect standard practice at
 * academic children's hospitals (WVU Children's Hospital context).
 *
 * Concentration units for drugs: mg/mL
 * Concentration units for diluents: % (w/v)
 *
 * The function receives the db instance to avoid circular imports
 * with db.ts.
 */

import type { DbSchema } from './schema';

interface SyncStore { data: DbSchema; write(): void; }

// ─── Types ────────────────────────────────────────────────────────────────────

interface Diluentseed {
  name: string;
  concentration_percent: number;
  description: string;
  safety_notes: string;
}

interface DrugSeed {
  name: string;
  default_concentration: number;
  max_concentration: number;
  min_concentration: number;
  concentration_unit: string;
  common_diluents: string; // resolved to comma-sep IDs at runtime
  safety_notes: string;
}

// ─── Diluent data ─────────────────────────────────────────────────────────────
// Sorted by concentration % ascending so the UI dropdown renders logically.

const DILUENTS: Diluentseed[] = [
  {
    name: 'Sterile Water',
    concentration_percent: 0.0,
    description: 'Sterile Water for Injection (SWFI)',
    safety_notes:
      'NEVER administer undiluted by IV push — severe hemolysis risk; ' +
      'use only for reconstitution or as a component in admixtures; ' +
      'hypotonic — do not use for IV resuscitation.',
  },
  {
    name: 'Normal Saline',
    concentration_percent: 0.9,
    description: '0.9% Sodium Chloride (isotonic NS)',
    safety_notes:
      'Isotonic — preferred for most IV drug dilutions and fluid resuscitation; ' +
      'monitor serum sodium in neonates on high-volume NS infusions; ' +
      'avoid in hypernatremia or hyperchloremic metabolic acidosis.',
  },
  {
    name: 'D5W',
    concentration_percent: 5.0,
    description: 'Dextrose 5% in Water',
    safety_notes:
      'Monitor blood glucose, especially in neonates and diabetic patients; ' +
      'not suitable for resuscitation (hypotonic); ' +
      'INCOMPATIBLE with ampicillin, penicillin-class antibiotics (rapid degradation).',
  },
  {
    name: 'D5NS',
    concentration_percent: 5.0,
    description: 'Dextrose 5% in 0.9% Normal Saline',
    safety_notes:
      'Contains both dextrose (5%) and sodium chloride (0.9%); ' +
      'monitor blood glucose and serum sodium; ' +
      'central line preferred for prolonged infusions; ' +
      'check drug compatibility — behaves like D5W for glucose-sensitive drugs.',
  },
  {
    name: 'D10W',
    concentration_percent: 10.0,
    description: 'Dextrose 10% in Water',
    safety_notes:
      'Standard neonatal/NICU maintenance fluid; ' +
      'central line strongly preferred — peripheral use limited to brief infusions; ' +
      'monitor blood glucose frequently; ' +
      'risk of hyperglycemia and rebound hypoglycemia if abruptly stopped.',
  },
  {
    name: 'D15W',
    concentration_percent: 15.0,
    description: 'Dextrose 15% in Water',
    safety_notes:
      'Central line REQUIRED — vesicant if extravasated peripherally; ' +
      'used in NICU TPN when fluid restriction necessitates high caloric density; ' +
      'strict blood glucose monitoring required; ' +
      'wean gradually to prevent rebound hypoglycemia.',
  },
  {
    name: 'D50W',
    concentration_percent: 50.0,
    description: 'Dextrose 50% in Water',
    safety_notes:
      'Central line ONLY — causes severe vein irritation, tissue necrosis if extravasated; ' +
      'primary use: emergency hypoglycemia treatment (adults) and TPN compounding source; ' +
      'in neonates, dilute to D10W or D25W before administration; ' +
      'extreme hyperglycemia risk — confirm patient weight-based dosing; ' +
      'use with extreme caution.',
  },
];

// ─── Drug seed data ───────────────────────────────────────────────────────────
// common_diluents is populated at runtime by resolving diluent names → IDs.
// Concentrations are in mg/mL.

type DrugSeedRaw = Omit<DrugSeed, 'common_diluents'> & { common_diluent_names: string[] };

const DRUGS_RAW: DrugSeedRaw[] = [
  // ═══════════════════════════════════════════════════════════
  //  ANTIBIOTICS
  // ═══════════════════════════════════════════════════════════

  {
    name: 'Vancomycin',
    default_concentration: 5.0,
    min_concentration: 2.0,
    max_concentration: 10.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['D5W', 'Normal Saline', 'D5NS'],
    safety_notes:
      'HIGH ALERT — Peripheral IV max 5 mg/mL; higher concentrations require central line. ' +
      'Infuse over MINIMUM 60 min (rate ≤10 mg/min) to prevent Red Man Syndrome (flushing, hypotension, erythema). ' +
      'Monitor AUC/MIC ratio (target AUC 400–600 mg·h/L) or trough 10–20 mcg/mL. ' +
      'NICU dosing: by gestational age + postnatal age. ' +
      'Nephrotoxic — monitor SCr/BUN; avoid concurrent aminoglycosides. ' +
      'INCOMPATIBLE with heparin in same line.',
  },
  {
    name: 'Gentamicin',
    default_concentration: 2.0,
    min_concentration: 0.8,
    max_concentration: 4.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['D5W', 'Normal Saline', 'Sterile Water'],
    safety_notes:
      'HIGH ALERT — Aminoglycoside: NEPHROTOXIC and OTOTOXIC. ' +
      'Stock vial: 40 mg/mL. Dilute to ≤4 mg/mL for IV infusion. ' +
      'Neonatal extended-interval dosing: interval based on gestational + postnatal age. ' +
      'Monitor peak (5–12 mcg/mL conventional) and trough (<1–2 mcg/mL). ' +
      'NEVER mix in same IV line as ampicillin or other beta-lactams (inactivation). ' +
      'INCOMPATIBLE with heparin in same line.',
  },
  {
    name: 'Ceftriaxone',
    default_concentration: 40.0,
    min_concentration: 20.0,
    max_concentration: 100.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'CONTRAINDICATED in neonates <28 days of age receiving calcium-containing IV solutions — ' +
      'fatal precipitates (ceftriaxone-calcium) have occurred in lungs and kidneys. ' +
      'NEVER co-infuse with calcium gluconate or TPN in same line, in any age group, without thorough flushing. ' +
      'Reconstitute 1 g vial with 9.6 mL SWFI → ~100 mg/mL, then dilute to 20–40 mg/mL for infusion. ' +
      'Infuse over 30 min in pediatrics, 60 min for doses >1 g or meningitis dosing.',
  },
  {
    name: 'Ampicillin',
    default_concentration: 50.0,
    min_concentration: 10.0,
    max_concentration: 100.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'Sterile Water'],
    safety_notes:
      'INCOMPATIBLE WITH DEXTROSE — rapid hydrolysis in acidic glucose solutions; use NS or SWFI only. ' +
      'Stability after reconstitution: ≤1 h RT, ≤4 h refrigerated. ' +
      'Do NOT mix or co-infuse with gentamicin or other aminoglycosides (chemical inactivation). ' +
      'NICU meningitis doses up to 200 mg/kg/day — verify indication-specific dosing. ' +
      'Monitor for seizures at high doses, especially with renal impairment.',
  },
  {
    name: 'Cefazolin',
    default_concentration: 20.0,
    min_concentration: 10.0,
    max_concentration: 100.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'First-generation cephalosporin — preferred for surgical prophylaxis. ' +
      'Reconstitute 1 g vial with 10 mL SWFI → 100 mg/mL; dilute to 20–40 mg/mL for IV infusion. ' +
      'Infuse over 30–60 min. ' +
      'Cross-sensitivity with penicillins rare (<1%) but ask about beta-lactam allergy. ' +
      'Adjust dose for renal impairment (CrCl <55 mL/min).',
  },
  {
    name: 'Piperacillin-Tazobactam',
    default_concentration: 40.0,
    min_concentration: 20.0,
    max_concentration: 200.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'Reported as piperacillin component concentration; standard ratio 8:1 pip:tazo. ' +
      'Reconstitute 3.375 g vial with 15 mL SWFI → ~200 mg/mL; further dilute to 20–40 mg/mL for standard infusion. ' +
      'Extended infusion (over 4 h) used for pharmacodynamic optimization in ICU patients. ' +
      'HIGH sodium content (~2.35 mEq/g pip) — monitor sodium in fluid-restricted patients. ' +
      'INCOMPATIBLE with aminoglycosides in same line. ' +
      'Do NOT use in combination with vancomycin without verifying compatibility.',
  },
  {
    name: 'Meropenem',
    default_concentration: 10.0,
    min_concentration: 2.0,
    max_concentration: 50.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'Carbapenem — broad-spectrum reserve antibiotic; require antimicrobial stewardship approval. ' +
      'Reconstitute 500 mg vial with 10 mL SWFI → 50 mg/mL; dilute to 5–20 mg/mL for infusion. ' +
      'Standard infusion: 30 min. Extended infusion (3–4 h): for MIC-challenging organisms. ' +
      'Monitor for seizures (lower seizure threshold vs. other carbapenems). ' +
      'NICU: stability data limited — prepare fresh; use within 1 h at RT or 4 h refrigerated. ' +
      'Adjust dose in renal impairment.',
  },
  {
    name: 'Azithromycin',
    default_concentration: 2.0,
    min_concentration: 1.0,
    max_concentration: 2.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W'],
    safety_notes:
      'Reconstitute 500 mg vial with 4.8 mL SWFI → 100 mg/mL; further dilute to 1–2 mg/mL for IV infusion. ' +
      'NEVER give as IV bolus or IM — severe hypotension may result. ' +
      'Infuse 500 mg dose over MINIMUM 60 min (1 mg/mL) or 3 h (2 mg/mL). ' +
      'QT prolongation risk — use caution with other QT-prolonging agents; obtain baseline ECG. ' +
      'Pyloric stenosis risk with oral azithromycin in neonates <6 weeks; consult for IV dosing.',
  },

  // ═══════════════════════════════════════════════════════════
  //  ANTIVIRALS
  // ═══════════════════════════════════════════════════════════

  {
    name: 'Acyclovir',
    default_concentration: 7.0,
    min_concentration: 5.0,
    max_concentration: 10.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'VESICANT — avoid extravasation; tissue necrosis may occur. ' +
      'pH ~11: highly irritating to peripheral veins. ' +
      'Infuse over MINIMUM 60 min — rapid infusion causes crystalluria and nephrotoxicity. ' +
      'Adequate hydration required before and during infusion. ' +
      'Monitor SCr and urine output; dose-adjust in renal impairment. ' +
      'Neonatal HSV: 60 mg/kg/day ÷ q8h × 14–21 days. ' +
      'Reconstitute 500 mg vial + 10 mL SWFI → 50 mg/mL, then dilute to ≤7 mg/mL.',
  },

  // ═══════════════════════════════════════════════════════════
  //  ELECTROLYTES & NUTRITION
  // ═══════════════════════════════════════════════════════════

  {
    name: 'Calcium Gluconate',
    default_concentration: 20.0,
    min_concentration: 10.0,
    max_concentration: 100.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['D5W', 'Normal Saline'],
    safety_notes:
      'HIGH ALERT — Peripheral IV: dilute to <20 mg/mL to reduce extravasation/necrosis risk. ' +
      'Central line preferred for concentrations >20 mg/mL or continuous infusions. ' +
      'NEVER co-administer with sodium bicarbonate or phosphate (precipitation). ' +
      'ECG monitoring recommended during rapid infusion — can cause bradycardia or arrest. ' +
      'CONFIRM salt form: gluconate (4.65 mEq Ca²⁺/10 mL) ≠ chloride (13.6 mEq Ca²⁺/10 mL). ' +
      'TPN: verify calcium-phosphate compatibility using solubility curves.',
  },
  {
    name: 'Potassium Chloride',
    default_concentration: 0.2,
    min_concentration: 0.1,
    max_concentration: 0.4,
    concentration_unit: 'mEq/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'D5NS'],
    safety_notes:
      'HIGH ALERT — NEVER administer undiluted KCl IV; fatal cardiac arrest results. ' +
      'Stock vial: 2 mEq/mL — MUST be diluted. ' +
      'Peripheral IV max rate: 0.3 mEq/kg/h in pediatrics; 10 mEq/h in adults. ' +
      'Central line required for concentrations >0.4 mEq/mL or rates >0.3 mEq/kg/h. ' +
      'Monitor ECG continuously for rapid correction of hypokalemia. ' +
      'Burning sensation common at peripheral IV sites — reduce rate or concentration. ' +
      'Neonates: max 0.1–0.2 mEq/kg/h; verify serum K⁺ before each dose.',
  },
  {
    name: 'Magnesium Sulfate',
    default_concentration: 40.0,
    min_concentration: 20.0,
    max_concentration: 80.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W'],
    safety_notes:
      'HIGH ALERT — Overdose causes respiratory depression, cardiac arrest. ' +
      'Stock vial: 500 mg/mL (50%) — MUST be diluted before IV administration. ' +
      'Dilute to 20–80 mg/mL (2–8%) for IV infusion. ' +
      'Infuse loading dose over at least 20–30 min; continuous infusion rate ≤1–2 g/h. ' +
      'Monitor deep tendon reflexes (loss → toxicity), serum Mg (goal 4–7 mg/dL therapeutic), respiratory rate. ' +
      'Antidote: calcium gluconate 100–200 mg IV (antagonizes Mg effects). ' +
      'NICU: for seizure prophylaxis in HIE — dose per institutional neonatal protocol.',
  },

  // ═══════════════════════════════════════════════════════════
  //  CARDIOVASCULAR
  // ═══════════════════════════════════════════════════════════

  {
    name: 'Dopamine',
    default_concentration: 1.6,
    min_concentration: 0.8,
    max_concentration: 3.2,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'D5NS'],
    safety_notes:
      'HIGH ALERT — Vasoactive; CENTRAL LINE STRONGLY PREFERRED. ' +
      'Stock: 80 mg/mL (40 mg/mL also available). Dilute to 0.8–3.2 mg/mL for infusion. ' +
      'Dose-dependent effects: 2–5 mcg/kg/min dopaminergic; 5–15 mcg/kg/min beta-1; >15 mcg/kg/min alpha-1. ' +
      'VESICANT — extravasation causes tissue necrosis; treat with phentolamine injection. ' +
      'INCOMPATIBLE with sodium bicarbonate and alkaline solutions (inactivation). ' +
      'Monitor HR, BP, urine output, and peripheral perfusion continuously. ' +
      'Titrate by mcg/kg/min using a standardized concentration for your institution.',
  },
  {
    name: 'Epinephrine',
    default_concentration: 0.05,
    min_concentration: 0.01,
    max_concentration: 0.1,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W'],
    safety_notes:
      'HIGH ALERT — Vasoactive/inotrope; CENTRAL LINE REQUIRED for continuous infusion. ' +
      'Stock: 1 mg/mL (1:1000). Dilute to 0.01–0.1 mg/mL (10–100 mcg/mL) for continuous infusion. ' +
      'Neonatal resuscitation cardiac arrest dose: 0.01–0.03 mg/kg IV (0.1–0.3 mL/kg of 0.1 mg/mL). ' +
      'VESICANT — extravasation causes ischemic necrosis. ' +
      'Continuous infusion: typically 0.01–1 mcg/kg/min; titrate to effect. ' +
      'Monitor HR, BP, glucose, and peripheral perfusion continuously. ' +
      'Protect from light; solution degrades rapidly.',
  },
  {
    name: 'Amiodarone',
    default_concentration: 1.8,
    min_concentration: 1.5,
    max_concentration: 6.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['D5W'],
    safety_notes:
      'HIGH ALERT — Antiarrhythmic with multiple serious adverse effects. ' +
      'Stock: 50 mg/mL. Dilute in D5W ONLY — NS causes precipitation. ' +
      'Loading dose concentration: 1.5–6 mg/mL depending on access (peripheral vs. central). ' +
      'Peripheral max: 2 mg/mL (higher concentrations cause phlebitis). ' +
      'ADSORBS to PVC tubing — use polyolefin/polyethylene (non-PVC) IV sets and glass bottles when possible. ' +
      'QT prolongation, pulmonary toxicity, thyroid dysfunction with chronic use. ' +
      'Pediatric VF/pulseless VT: 5 mg/kg IV bolus. ' +
      'Infuse loading dose over 20–60 min (cardiac arrest: rapid IV push).',
  },

  // ═══════════════════════════════════════════════════════════
  //  SEDATION / PAIN
  // ═══════════════════════════════════════════════════════════

  {
    name: 'Fentanyl',
    default_concentration: 10.0,
    min_concentration: 2.0,
    max_concentration: 50.0,
    concentration_unit: 'mcg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'HIGH ALERT — Opioid; respiratory depression risk. ' +
      'Stock: 50 mcg/mL. Dilute to 2–25 mcg/mL for neonatal/pediatric continuous infusions. ' +
      'Neonates: start 0.5–2 mcg/kg/h; titrate slowly to avoid chest wall rigidity (especially with rapid IV push). ' +
      'Chest wall rigidity ("wooden chest syndrome") with rapid large IV boluses — have naloxone and NMBA ready. ' +
      'Tolerance develops rapidly with continuous infusion; taper to avoid withdrawal. ' +
      'Use preservative-free formulation for neonates. ' +
      'Reversal: naloxone 0.01 mg/kg IV (titrate; avoid precipitating severe withdrawal).',
  },
  {
    name: 'Morphine',
    default_concentration: 1.0,
    min_concentration: 0.1,
    max_concentration: 5.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'HIGH ALERT — Opioid; respiratory depression risk. ' +
      'Stock: 10 mg/mL. Dilute to 0.1–1 mg/mL for neonatal infusions; higher concentrations acceptable for older pediatric/adult. ' +
      'Neonates: 0.01–0.05 mg/kg/h continuous infusion; bolus 0.05–0.1 mg/kg over 5 min minimum. ' +
      'Use preservative-free formulation for neonates (benzyl alcohol-free). ' +
      'Histamine release can cause hypotension, bronchospasm. ' +
      'Tolerance and physical dependence with prolonged use; taper per institutional protocol. ' +
      'Reversal: naloxone 0.01 mg/kg IV.',
  },
  {
    name: 'Midazolam',
    default_concentration: 1.0,
    min_concentration: 0.5,
    max_concentration: 5.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'HIGH ALERT — Benzodiazepine; respiratory depression and hypotension risk, especially in neonates. ' +
      'Stock: 5 mg/mL. Dilute to 0.5–1 mg/mL for neonatal/pediatric continuous infusions. ' +
      'NICU: contains benzyl alcohol preservative in some formulations — use preservative-free for neonates. ' +
      'Propylene glycol toxicity with high cumulative doses in neonates (metabolic acidosis, renal failure). ' +
      'Accumulates in renal/hepatic impairment — monitor for prolonged sedation. ' +
      'Reversal: flumazenil 0.01 mg/kg IV (short-acting — resedation possible; monitor for ≥2 h). ' +
      'Tolerance develops rapidly; taper to avoid withdrawal seizures.',
  },

  // ═══════════════════════════════════════════════════════════
  //  CHEMOTHERAPY  (require pharmacist preparation/verification)
  // ═══════════════════════════════════════════════════════════

  {
    name: 'Vincristine',
    default_concentration: 1.0,
    min_concentration: 0.01,
    max_concentration: 1.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W'],
    safety_notes:
      'BLACK BOX WARNING — FATAL IF GIVEN INTRATHECALLY. ' +
      'Vincristine is for INTRAVENOUS USE ONLY. Never dispense or transport without intrathecal protection protocols (minibag mandate). ' +
      'Stock: 1 mg/mL. Dilute further in minibag (≥25 mL NS or D5W) per intrathecal protection policies. ' +
      'MUST be prepared by trained oncology pharmacy staff under appropriate safety controls. ' +
      'Vesicant — CENTRAL LINE required; severe tissue necrosis with extravasation. ' +
      'Requires independent double-check at every step of preparation and administration. ' +
      'Peripheral neuropathy is dose-limiting toxicity — document baseline neuro exam.',
  },
  {
    name: 'Methotrexate',
    default_concentration: 25.0,
    min_concentration: 0.4,
    max_concentration: 25.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'HIGH ALERT — Chemotherapy and immunosuppressant; requires independent pharmacist verification. ' +
      'Multiple concentrations available (2.5 mg/mL oral, 25 mg/mL IV) — verify dose and route carefully. ' +
      'High-dose MTX (>1 g/m²): requires leucovorin rescue, aggressive hydration (urine pH >7), and frequent MTX level monitoring. ' +
      'Severely nephrotoxic at high doses — hold nephrotoxic agents; ensure adequate urine output before infusion. ' +
      'NEVER give intrathecal dose IV or IV dose intrathecally. ' +
      'Folic acid antagonist — do not co-administer folate supplements that would antagonize therapy.',
  },

  // ═══════════════════════════════════════════════════════════
  //  OTHER HIGH-ALERT MEDICATIONS
  // ═══════════════════════════════════════════════════════════

  {
    name: 'Insulin Regular',
    default_concentration: 1.0,
    min_concentration: 0.1,
    max_concentration: 1.0,
    concentration_unit: 'units/mL',
    common_diluent_names: ['Normal Saline'],
    safety_notes:
      'HIGH ALERT — Hypoglycemia risk. ' +
      'Stock: 100 units/mL. Dilute to 0.1–1 unit/mL for neonatal/pediatric continuous infusions. ' +
      'Neonates: typically 0.01–0.1 units/kg/h; dilute to 0.1–0.5 units/mL in NS. ' +
      'Insulin ADSORBS to PVC tubing and IV bags — prime tubing with insulin solution and discard first 20–30 mL before connecting to patient. ' +
      'Monitor blood glucose every 30–60 min at initiation and with dose changes. ' +
      'ONLY use Regular insulin (Humulin R) IV — do NOT use long-acting or rapid-acting analogs IV. ' +
      'Requires independent double-check for dose calculation and preparation.',
  },
  {
    name: 'Heparin',
    default_concentration: 1.0,
    min_concentration: 0.5,
    max_concentration: 100.0,
    concentration_unit: 'units/mL',
    common_diluent_names: ['Normal Saline', 'D5W'],
    safety_notes:
      'HIGH ALERT — Bleeding risk; neonatal and pediatric dosing is weight-based. ' +
      'Stock: 1000 units/mL (also 5000, 10000 units/mL — verify concentration before use). ' +
      'Flush concentration (pediatric): 0.5–1 unit/mL in NS. ' +
      'Flush concentration (adult): 10–100 units/mL per institutional protocol. ' +
      'Therapeutic anticoagulation: 1 unit/mL typical; dose by anti-Xa or aPTT protocol. ' +
      'INCOMPATIBLE with gentamicin, vancomycin, and many drugs — flush line thoroughly before co-administration. ' +
      'Neonates: premature neonates at higher risk for IVH — heparin lock concentration ≤0.5 units/mL recommended. ' +
      'Monitor for HIT (heparin-induced thrombocytopenia) with prolonged use.',
  },

  // ═══════════════════════════════════════════════════════════
  //  ADDITIONAL ANTIBIOTICS
  // ═══════════════════════════════════════════════════════════

  {
    name: 'Cefepime',
    default_concentration: 20.0,
    min_concentration: 10.0,
    max_concentration: 40.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      '4th-generation cephalosporin; active against Pseudomonas. ' +
      'Reconstitute 1 g vial with 10 mL SWFI → ~100 mg/mL; dilute to 10–40 mg/mL for IV infusion. ' +
      'Infuse over 30 min (standard) or 3–4 h extended infusion for resistant organisms. ' +
      'Neurotoxicity risk (encephalopathy, seizures) with accumulation — dose-adjust for renal impairment. ' +
      'Pediatric dosing: 50 mg/kg/dose q8h (max 2 g/dose); up to q6h for febrile neutropenia.',
  },
  {
    name: 'Ceftazidime',
    default_concentration: 20.0,
    min_concentration: 10.0,
    max_concentration: 40.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      '3rd-gen cephalosporin with Pseudomonas activity. ' +
      'Reconstitute with SWFI; dilute to 10–40 mg/mL for IV infusion. ' +
      'Infuse over 30 min; extended infusion (3–4 h) used in ICU for pharmacodynamic benefit. ' +
      'Often combined with avibactam (Avycaz) for resistant organisms — check the combination product separately. ' +
      'Adjust dose in renal impairment.',
  },
  {
    name: 'Nafcillin',
    default_concentration: 10.0,
    min_concentration: 5.0,
    max_concentration: 40.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'Sterile Water'],
    safety_notes:
      'Anti-staphylococcal penicillin — drug of choice for MSSA bacteremia. ' +
      'Reconstitute with SWFI; dilute to 5–10 mg/mL for peripheral IV or up to 40 mg/mL for central line. ' +
      'IRRITANT — phlebitis common at peripheral sites; rotate IV sites frequently. ' +
      'INCOMPATIBLE with dextrose solutions — use NS only. ' +
      'Hepatotoxic — monitor LFTs with prolonged use. ' +
      'Interstitial nephritis risk with high doses.',
  },
  {
    name: 'Oxacillin',
    default_concentration: 10.0,
    min_concentration: 5.0,
    max_concentration: 40.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'Sterile Water'],
    safety_notes:
      'Anti-staphylococcal penicillin; similar to nafcillin. ' +
      'Use NS only — INCOMPATIBLE with dextrose solutions (hydrolysis). ' +
      'Peripheral IV: dilute to ≤10 mg/mL to reduce phlebitis. ' +
      'Hepatotoxicity reported (less common than nafcillin); monitor LFTs. ' +
      'Neonatal dosing: 25–50 mg/kg/dose per gestational/postnatal age-based interval.',
  },
  {
    name: 'Tobramycin',
    default_concentration: 2.0,
    min_concentration: 0.8,
    max_concentration: 4.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'HIGH ALERT — Aminoglycoside: NEPHROTOXIC and OTOTOXIC. ' +
      'Stock: 10 mg/mL or 40 mg/mL; dilute to ≤4 mg/mL for IV infusion. ' +
      'Neonates: extended-interval dosing by gestational + postnatal age (same principles as gentamicin). ' +
      'Monitor peak (4–10 mcg/mL) and trough (<2 mcg/mL). ' +
      'Preferred over gentamicin for Pseudomonas aeruginosa. ' +
      'NEVER mix in same line with beta-lactams.',
  },
  {
    name: 'Amikacin',
    default_concentration: 5.0,
    min_concentration: 2.5,
    max_concentration: 10.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'HIGH ALERT — Aminoglycoside: NEPHROTOXIC and OTOTOXIC. ' +
      'Stock: 250 mg/mL; dilute to 2.5–10 mg/mL for IV infusion. ' +
      'Reserved for gentamicin/tobramycin-resistant organisms. ' +
      'Higher therapeutic serum concentrations than gentamicin: peak goal 20–35 mcg/mL; trough <8 mcg/mL. ' +
      'NICU: dosing by gestational + postnatal age; longer dosing intervals in premature neonates. ' +
      'Infuse over 30–60 min.',
  },
  {
    name: 'Clindamycin',
    default_concentration: 6.0,
    min_concentration: 3.0,
    max_concentration: 12.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W'],
    safety_notes:
      'Stock: 150 mg/mL; dilute to 6–12 mg/mL for IV infusion. ' +
      'MAX IV concentration: 18 mg/mL. Infuse at max rate of 30 mg/min (over at least 10–20 min per dose). ' +
      'Rapid infusion → cardiopulmonary arrest. Never give as IV bolus. ' +
      'Associated with Clostridioides difficile colitis — monitor for diarrhea. ' +
      'Active against MRSA (skin/soft tissue), anaerobes, and streptococcal infections.',
  },
  {
    name: 'Metronidazole',
    default_concentration: 5.0,
    min_concentration: 5.0,
    max_concentration: 8.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W'],
    safety_notes:
      'Ready-to-use 5 mg/mL bags are commercially available — verify if further dilution is needed. ' +
      'Infuse over 30–60 min; avoid rapid infusion (metallic taste, nausea, flushing). ' +
      'Contains 28 mEq sodium per 500 mg bag — monitor sodium in restricted patients. ' +
      'Peripheral neuropathy and CNS toxicity with prolonged high-dose therapy. ' +
      'Disulfiram-like reaction with alcohol — counsel patients and caregivers. ' +
      'Neonates: single IV dose used for prophylaxis/treatment of anaerobic infections.',
  },
  {
    name: 'Linezolid',
    default_concentration: 2.0,
    min_concentration: 2.0,
    max_concentration: 2.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W'],
    safety_notes:
      'Commercially available as 2 mg/mL ready-to-use solution — use as provided; no further dilution required. ' +
      'Infuse over 30–120 min. ' +
      'Myelosuppression (thrombocytopenia, anemia) with courses >2 weeks — weekly CBC monitoring. ' +
      'Serotonin syndrome risk with serotonergic agents (SSRIs, tramadol) — avoid combination. ' +
      'MAO inhibitor activity — avoid tyramine-rich foods and sympathomimetics. ' +
      'Neonates: variable pharmacokinetics — drug level monitoring recommended.',
  },
  {
    name: 'Ciprofloxacin',
    default_concentration: 2.0,
    min_concentration: 1.0,
    max_concentration: 2.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W'],
    safety_notes:
      'Commercially available as 2 mg/mL ready-to-use solution. ' +
      'Infuse over 60 min; infusion-related reactions with rapid administration. ' +
      'Use in pediatrics generally reserved for Pseudomonas, anthrax, or when no safe alternative exists — ' +
      'cartilage toxicity concerns limit routine pediatric use (FDA black box in pediatrics). ' +
      'QT prolongation risk — obtain baseline ECG. ' +
      'INCOMPATIBLE with aminophylline, dexamethasone, and many other drugs — dedicated line recommended.',
  },
  {
    name: 'Trimethoprim-Sulfamethoxazole',
    default_concentration: 1.0,
    min_concentration: 0.5,
    max_concentration: 1.6,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['D5W', 'Normal Saline'],
    safety_notes:
      'Concentration expressed as trimethoprim component; stock contains 80 mg TMP + 400 mg SMX per 5 mL vial (16/80 mg/mL). ' +
      'Dilute in D5W (preferred) or NS to 0.5–1.6 mg TMP/mL. ' +
      'CONTRAINDICATED in infants <2 months (risk of kernicterus, folate-deficiency). ' +
      'Infuse over 60–90 min minimum — NEVER give as bolus or IM. ' +
      'HIGH SODIUM LOAD in vehicle (benzyl alcohol in some formulations — avoid in neonates). ' +
      'Monitor SCr, electrolytes (hyperkalemia risk), and CBC (bone marrow suppression).',
  },
  {
    name: 'Ertapenem',
    default_concentration: 20.0,
    min_concentration: 10.0,
    max_concentration: 20.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline'],
    safety_notes:
      'Carbapenem — NO Pseudomonas or Acinetobacter activity (unlike meropenem/imipenem). ' +
      'Reconstitute 1 g vial in 10 mL SWFI → ~100 mg/mL; dilute to 20 mg/mL in NS ONLY (not dextrose). ' +
      'Infuse over 30 min. ' +
      'Once-daily dosing makes it suitable for outpatient parenteral antibiotic therapy (OPAT). ' +
      'Seizure risk — exercise caution in patients with CNS disorders or renal impairment. ' +
      'Pediatric dosing: 15 mg/kg q12h for age 3 months to 12 years (max 1 g/day).',
  },
  {
    name: 'Daptomycin',
    default_concentration: 10.0,
    min_concentration: 5.0,
    max_concentration: 10.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline'],
    safety_notes:
      'Cyclic lipopeptide — active against MRSA, VRE, and resistant gram-positives. ' +
      'Reconstitute 500 mg vial in 10 mL NS → 50 mg/mL; further dilute to 5–10 mg/mL in NS ONLY. ' +
      'NEVER use D5W — incompatible. ' +
      'INACTIVATED by pulmonary surfactant — do NOT use for pneumonia. ' +
      'Myopathy/rhabdomyolysis risk — weekly CPK monitoring; hold statins during therapy. ' +
      'Infuse over 30 min (IV). Alternatively, 2-min IV push at 50 mg/mL concentration. ' +
      'Pediatric dosing: investigational; consult ID/pharmacy.',
  },

  // ═══════════════════════════════════════════════════════════
  //  ANTIFUNGALS & ADDITIONAL ANTIVIRALS
  // ═══════════════════════════════════════════════════════════

  {
    name: 'Ganciclovir',
    default_concentration: 5.0,
    min_concentration: 2.0,
    max_concentration: 10.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'HIGH ALERT — Myelosuppressive: neutropenia, thrombocytopenia, anemia. ' +
      'Reconstitute 500 mg vial with 10 mL SWFI → 50 mg/mL; further dilute to ≤10 mg/mL. ' +
      'Infuse over 1 hour — rapid infusion increases nephrotoxicity and hematologic toxicity. ' +
      'TERATOGENIC and MUTAGENIC — handle as cytotoxic agent; appropriate PPE required. ' +
      'Neutropenia threshold: hold if ANC <500/mm³. ' +
      'Neonatal CMV: 6 mg/kg/dose IV q12h (adjust per renal function). ' +
      'Monitor CBC twice weekly during therapy.',
  },
  {
    name: 'Foscarnet',
    default_concentration: 12.0,
    min_concentration: 6.0,
    max_concentration: 24.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W'],
    safety_notes:
      'NEPHROTOXIC — aggressive hydration REQUIRED (500–1000 mL NS before each infusion). ' +
      'Stock: 24 mg/mL; dilute to 12 mg/mL for peripheral IV; central line may use 24 mg/mL undiluted. ' +
      'Infusion pump required — infuse over 1–2 h (induction) or 2 h (maintenance). ' +
      'Electrolyte wasting: hypomagnesemia, hypocalcemia, hypokalemia, hypophosphatemia — monitor and replace aggressively. ' +
      'PAINFUL genital ulcerations — ensure adequate hydration and hygiene. ' +
      'Reserve for CMV/HSV resistant to ganciclovir/acyclovir.',
  },
  {
    name: 'Amphotericin B (Conventional)',
    default_concentration: 0.1,
    min_concentration: 0.1,
    max_concentration: 0.25,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['D5W'],
    safety_notes:
      'HIGH ALERT — Significant infusion reactions and nephrotoxicity. ' +
      'Reconstitute 50 mg vial with 10 mL SWFI → 5 mg/mL; further dilute in D5W ONLY to 0.1 mg/mL (peripheral) or 0.25 mg/mL (central). ' +
      'NEVER use NS or electrolyte solutions — precipitation occurs immediately. ' +
      'Infuse over 2–6 h through in-line 1-micron filter; light-protect infusion bag. ' +
      'Pre-medicate: acetaminophen, diphenhydramine ± hydrocortisone to reduce infusion reactions. ' +
      'Hypokalemia and hypomagnesemia common — aggressive replacement required. ' +
      'Monitor SCr, electrolytes, CBC daily. Liposomal formulations preferred to reduce toxicity.',
  },
  {
    name: 'Amphotericin B Liposomal (AmBisome)',
    default_concentration: 2.0,
    min_concentration: 0.5,
    max_concentration: 2.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['D5W'],
    safety_notes:
      'Preferred formulation over conventional amphotericin — markedly reduced nephrotoxicity and infusion reactions. ' +
      'Reconstitute 50 mg vial with 12 mL SWFI → ~4 mg/mL; further dilute in D5W ONLY to 1–2 mg/mL. ' +
      'Infuse through 5-micron in-line filter at 2 mg/mL; protect from light. ' +
      'Do NOT mix with other drugs or electrolytes. ' +
      'Infuse over 2 h; may extend to 4–6 h if infusion reactions occur. ' +
      'Neonates: preferred antifungal for disseminated candidiasis at 3–5 mg/kg/day.',
  },
  {
    name: 'Fluconazole',
    default_concentration: 2.0,
    min_concentration: 2.0,
    max_concentration: 2.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W'],
    safety_notes:
      'Commercially available as 2 mg/mL ready-to-use solution. ' +
      'Infuse at max rate of 200 mg/h (do not exceed); infuse over at least 1–2 h for doses >200 mg. ' +
      'QT prolongation risk — caution with other QT-prolonging agents. ' +
      'Potent CYP2C9/CYP3A4 inhibitor — significant drug interactions (warfarin, tacrolimus, phenytoin). ' +
      'Neonatal prophylaxis: 3–6 mg/kg twice weekly; treatment 6–12 mg/kg/day. ' +
      'Adjust dose in renal impairment (CrCl <50 mL/min).',
  },
  {
    name: 'Micafungin',
    default_concentration: 1.5,
    min_concentration: 0.5,
    max_concentration: 4.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W'],
    safety_notes:
      'Echinocandin antifungal — minimal drug interactions; no renal dose adjustment needed. ' +
      'Reconstitute 50 mg or 100 mg vial with 5 mL NS or D5W; dilute further to 0.5–4 mg/mL. ' +
      'Infuse over 60 min; protect from light. ' +
      'Preferred antifungal in neonates for Candida infections (3 mg/kg/day); limited hepatotoxicity. ' +
      'Histamine-mediated infusion reactions rare but possible. ' +
      'Limited activity against Cryptococcus and molds.',
  },
  {
    name: 'Caspofungin',
    default_concentration: 0.5,
    min_concentration: 0.2,
    max_concentration: 0.5,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline'],
    safety_notes:
      'Echinocandin — dilute in NS ONLY; D5W or dextrose solutions cause precipitation. ' +
      'Reconstitute vial in NS to ~7 mg/mL; further dilute to 0.5 mg/mL in NS. ' +
      'Infuse over 60 min. ' +
      'Cyclosporine co-administration increases caspofungin AUC 35% — avoid combination if possible. ' +
      'Hepatotoxicity with concurrent cyclosporine — monitor LFTs. ' +
      'Pediatric dosing: 70 mg/m² loading dose, then 50 mg/m²/day.',
  },
  {
    name: 'Voriconazole',
    default_concentration: 5.0,
    min_concentration: 2.0,
    max_concentration: 5.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'Broad-spectrum triazole — first-line for invasive aspergillosis. ' +
      'IV formulation contains sulfobutylether-beta-cyclodextrin (SBECD) — AVOID in patients with SCr >2.5 mg/dL (SBECD accumulates). ' +
      'Reconstitute 200 mg vial with 19 mL SWFI → ~10 mg/mL; dilute to ≤5 mg/mL for infusion. ' +
      'Infuse over 1–3 h; max rate 3 mg/kg/h. ' +
      'Visual disturbances common (photopsia) — warn patients. ' +
      'QT prolongation, hepatotoxicity — monitor ECG and LFTs. ' +
      'Major CYP2C19/CYP3A4 inhibitor — extensive drug interactions; check formulary.',
  },

  // ═══════════════════════════════════════════════════════════
  //  ADDITIONAL CARDIOVASCULAR
  // ═══════════════════════════════════════════════════════════

  {
    name: 'Dobutamine',
    default_concentration: 2.0,
    min_concentration: 0.5,
    max_concentration: 4.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'D5NS'],
    safety_notes:
      'HIGH ALERT — Positive inotrope; CENTRAL LINE strongly preferred. ' +
      'Stock: 250 mg/20 mL (12.5 mg/mL); dilute to 0.5–4 mg/mL for infusion. ' +
      'Titrate by mcg/kg/min (typical range: 2–20 mcg/kg/min). ' +
      'Tachycardia and arrhythmias are dose-limiting — continuous ECG monitoring required. ' +
      'Neonatal use: may worsen RVOTO in tetralogy of Fallot — use caution. ' +
      'Contains sodium bisulfite — allergy risk in sulfite-sensitive patients.',
  },
  {
    name: 'Milrinone',
    default_concentration: 0.2,
    min_concentration: 0.1,
    max_concentration: 0.4,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'D5NS'],
    safety_notes:
      'HIGH ALERT — PDE3 inhibitor: inodilator (positive inotropy + vasodilation). ' +
      'Stock: 1 mg/mL; dilute to 0.1–0.4 mg/mL. CENTRAL LINE REQUIRED. ' +
      'Typical infusion: 0.25–0.75 mcg/kg/min (loading dose rarely used in pediatrics — causes hypotension). ' +
      'Accumulates in renal impairment — reduce dose or avoid; monitor for hypotension and arrhythmia. ' +
      'Neonatal post-cardiac surgery: commonly used at 0.25–0.5 mcg/kg/min. ' +
      'INCOMPATIBLE with furosemide (precipitation) — flush between drugs.',
  },
  {
    name: 'Norepinephrine',
    default_concentration: 0.08,
    min_concentration: 0.02,
    max_concentration: 0.16,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'D5NS'],
    safety_notes:
      'HIGH ALERT — Potent vasopressor; CENTRAL LINE REQUIRED. ' +
      'Stock: 1 mg/mL (base); dilute to 0.02–0.16 mg/mL. ' +
      'VESICANT — extravasation causes severe ischemic necrosis; treat with phentolamine 5–10 mg in 10 mL NS. ' +
      'Continuous hemodynamic monitoring and arterial line required. ' +
      'Infuse via dedicated IV line; avoid interruption (even brief stoppage causes hemodynamic collapse). ' +
      'INCOMPATIBLE with sodium bicarbonate and alkaline solutions.',
  },
  {
    name: 'Vasopressin',
    default_concentration: 0.2,
    min_concentration: 0.1,
    max_concentration: 1.0,
    concentration_unit: 'units/mL',
    common_diluent_names: ['Normal Saline', 'D5W'],
    safety_notes:
      'HIGH ALERT — Vasoactive peptide; CENTRAL LINE REQUIRED for continuous infusion. ' +
      'Stock: 20 units/mL; dilute to 0.1–1 unit/mL. ' +
      'Septic shock in adults: 0.03–0.04 units/min (non-titratable adjunct — fixed dose). ' +
      'Neonatal/pediatric: 0.0003–0.002 units/kg/min; used for refractory hypotension. ' +
      'Peripheral vasoconstriction can reduce limb perfusion — monitor extremities. ' +
      'May cause hyponatremia (ADH effect) — monitor serum sodium. ' +
      'Not to be confused with vasopressin for DI (different dose range) — specify indication.',
  },
  {
    name: 'Nitroprusside',
    default_concentration: 0.2,
    min_concentration: 0.1,
    max_concentration: 0.4,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['D5W'],
    safety_notes:
      'HIGH ALERT — Potent vasodilator; ARTERIAL LINE and ICU monitoring required. ' +
      'Dilute ONLY in D5W — not NS (chemical incompatibility). ' +
      'Stock: 50 mg vial; dilute to 200–400 mcg/mL (0.2–0.4 mg/mL). ' +
      'LIGHT-SENSITIVE — wrap infusion bag and tubing in foil immediately after mixing. ' +
      'Cyanide/thiocyanate toxicity with prolonged high-dose infusion (>3–10 mcg/kg/min for >48–72 h). ' +
      'Monitor thiocyanate levels if prolonged use; hydroxocobalamin antidote available. ' +
      'Titrate by 0.5 mcg/kg/min every 5 min to effect; abrupt discontinuation may cause rebound hypertension.',
  },
  {
    name: 'Nitroglycerin',
    default_concentration: 0.1,
    min_concentration: 0.05,
    max_concentration: 0.4,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['D5W', 'Normal Saline'],
    safety_notes:
      'HIGH ALERT — Vasodilator; requires dedicated IV pump and continuous BP monitoring. ' +
      'Stock: 5 mg/mL; dilute to 50–200 mcg/mL (0.05–0.2 mg/mL) for infusion. ' +
      'ADSORBS to PVC tubing — use non-PVC polyethylene (PE) or glass containers and non-PVC IV sets; ' +
      'may lose 40–80% of dose with standard PVC tubing. ' +
      'Do NOT use IV filters (adsorbs to filter membrane). ' +
      'Headache and hypotension are common dose-related effects. ' +
      'Methemoglobinemia risk with high doses or glucose-6-phosphate dehydrogenase (G6PD) deficiency.',
  },
  {
    name: 'Esmolol',
    default_concentration: 10.0,
    min_concentration: 2.5,
    max_concentration: 20.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'D5NS'],
    safety_notes:
      'Ultra-short-acting beta-1 selective blocker — half-life ~9 min; ideal for rapid titration. ' +
      'Premixed 2.5 g/250 mL (10 mg/mL) bag available commercially. ' +
      'Loading dose: 500 mcg/kg over 1 min; maintenance 50–200 mcg/kg/min. ' +
      'Hypotension common — titrate carefully; have vasopressor ready. ' +
      'AVOID in decompensated heart failure, reactive airway disease (beta blockade). ' +
      'HIGH CONCENTRATION solutions (250 mg/mL) for loading dose are VESICANT — use dedicated IV line; do NOT use veins of hand/wrist.',
  },
  {
    name: 'Labetalol',
    default_concentration: 1.0,
    min_concentration: 0.5,
    max_concentration: 2.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W'],
    safety_notes:
      'Combined alpha-1 and non-selective beta-blocker; useful for hypertensive urgency. ' +
      'Stock: 5 mg/mL; dilute to 1–2 mg/mL for continuous infusion. ' +
      'Bolus dosing: 20 mg IV over 2 min; repeat 40–80 mg q10 min to effect. ' +
      'Continuous infusion: 1–2 mg/min. ' +
      'Avoid in decompensated heart failure, reactive airway disease, bradycardia, and heart block. ' +
      'Postural hypotension — keep supine for at least 3 h post-dose. ' +
      'Pediatric: limited data; 0.2–1 mg/kg/h infusion used in hypertensive emergencies.',
  },
  {
    name: 'Nicardipine',
    default_concentration: 0.1,
    min_concentration: 0.05,
    max_concentration: 0.2,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'D5NS'],
    safety_notes:
      'Dihydropyridine calcium channel blocker; preferred for hypertensive emergencies in stroke/eclampsia. ' +
      'Stock: 25 mg/10 mL (2.5 mg/mL); dilute to 0.1 mg/mL for standard infusion. ' +
      'CENTRAL LINE preferred (peripheral site phlebitis common at concentrations >0.1 mg/mL). ' +
      'Infusion range: 5–15 mg/h in adults; titrate by 2.5 mg/h q5–15 min. ' +
      'Reflex tachycardia common — use with beta-blocker if problematic. ' +
      'Pediatric neonatal/infant dosing: 1–3 mcg/kg/min, titrate carefully.',
  },
  {
    name: 'Hydralazine',
    default_concentration: 0.4,
    min_concentration: 0.2,
    max_concentration: 1.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline'],
    safety_notes:
      'Direct arterial vasodilator — use for moderate-to-severe hypertension. ' +
      'Stock: 20 mg/mL; dilute to 0.2–1 mg/mL in NS (NOT dextrose — degradation may occur). ' +
      'Bolus: 0.1–0.6 mg/kg/dose (adults: 10–40 mg) IV over 20 min; onset 5–20 min, duration 2–4 h. ' +
      'Reflex tachycardia and sodium/fluid retention with chronic use. ' +
      'Lupus-like syndrome with high cumulative doses. ' +
      'Used in obstetrics for eclampsia; also for CHF (combined with nitrates as hydralazine-ISDN regimen).',
  },

  // ═══════════════════════════════════════════════════════════
  //  ADDITIONAL SEDATION / ANALGESIA / NEUROLOGY
  // ═══════════════════════════════════════════════════════════

  {
    name: 'Ketamine',
    default_concentration: 2.0,
    min_concentration: 0.5,
    max_concentration: 10.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'Dissociative anesthetic/analgesic; preserves airway reflexes and bronchodilates. ' +
      'Stock: 10 mg/mL, 50 mg/mL, or 100 mg/mL — confirm concentration before use. ' +
      'Procedural sedation: 1–2 mg/kg IV (inject slowly over 1–2 min). ' +
      'Continuous infusion: 0.1–0.5 mg/kg/h (subanesthetic for pain/sedation). ' +
      'NICU emergence agitation: less common in younger patients. ' +
      'Raises ICP — traditionally avoided in TBI (newer data suggest it may be safe). ' +
      'Co-administer benzodiazepine to reduce emergence hallucinations. ' +
      'Causes hypersalivation — consider glycopyrrolate pretreatment.',
  },
  {
    name: 'Dexmedetomidine',
    default_concentration: 4.0,
    min_concentration: 2.0,
    max_concentration: 8.0,
    concentration_unit: 'mcg/mL',
    common_diluent_names: ['Normal Saline'],
    safety_notes:
      'Selective alpha-2 agonist — sedation without respiratory depression; allows easy arousability. ' +
      'Stock: 200 mcg/mL; dilute to 4 mcg/mL in NS (standard) for infusion. ' +
      'Loading dose (0.5–1 mcg/kg over 10 min) often omitted in hemodynamically unstable patients. ' +
      'Maintenance: 0.2–0.7 mcg/kg/h (up to 1.5 mcg/kg/h in some protocols). ' +
      'Bradycardia and hypotension: dose-related; may require atropine or vasopressor support. ' +
      'NICU: used for procedural sedation and to facilitate weaning from mechanical ventilation. ' +
      'Abrupt discontinuation after prolonged use can cause rebound hypertension and agitation.',
  },
  {
    name: 'Propofol',
    default_concentration: 10.0,
    min_concentration: 10.0,
    max_concentration: 10.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['D5W'],
    safety_notes:
      'CONTRAINDICATED in children <3 years for ICU sedation — Propofol Infusion Syndrome (PRIS) risk. ' +
      'Use ONLY 10 mg/mL formulation (do not further dilute); prepared as 1% (10 mg/mL) emulsion. ' +
      'If dilution required: use D5W ONLY to minimum 2 mg/mL; do not dilute below 2 mg/mL. ' +
      'PRIS: metabolic acidosis, cardiac failure, rhabdomyolysis — fatal; limit infusion <4 mg/kg/h and <48 h in adults. ' +
      'Contains soybean oil and egg lecithin — avoid in soy/egg allergy. ' +
      'Strict aseptic technique required — emulsion supports microbial growth; discard after 12 h. ' +
      'Hypertriglyceridemia with prolonged use — monitor lipid panel.',
  },
  {
    name: 'Lorazepam',
    default_concentration: 0.5,
    min_concentration: 0.1,
    max_concentration: 2.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'HIGH ALERT — Benzodiazepine; respiratory depression and oversedation risk. ' +
      'Stock: 2 mg/mL or 4 mg/mL; dilute to 0.1–2 mg/mL for infusion. ' +
      'Contains propylene glycol (PG) — toxicity with high-dose continuous infusion (metabolic acidosis, AKI, CNS depression). ' +
      'Monitor osmol gap as surrogate for PG accumulation when infusing >1 mg/kg/h for >48 h. ' +
      'NICU/pediatric status epilepticus: 0.05–0.1 mg/kg IV (max 4 mg/dose). ' +
      'Irritant — phlebitis at peripheral IV sites. ' +
      'Tolerance and physical dependence with prolonged use; structured taper required.',
  },
  {
    name: 'Phenobarbital',
    default_concentration: 5.0,
    min_concentration: 1.0,
    max_concentration: 20.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'Sterile Water'],
    safety_notes:
      'First-line antiepileptic for neonatal seizures. ' +
      'Stock: 65 or 130 mg/mL — MUST dilute before IV administration; do not inject undiluted. ' +
      'Dilute to 5–10 mg/mL for IV infusion; maximum rate: 1 mg/kg/min (neonates), 2 mg/kg/min (children). ' +
      'VESICANT — extravasation causes tissue necrosis. ' +
      'Loading dose neonates: 20 mg/kg IV (may repeat 10 mg/kg × 2 for refractory seizures). ' +
      'Respiratory depression risk — have bag-mask ventilation at bedside. ' +
      'Highly protein-bound and induces hepatic enzymes — extensive drug interactions.',
  },
  {
    name: 'Fosphenytoin',
    default_concentration: 10.0,
    min_concentration: 1.5,
    max_concentration: 25.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W'],
    safety_notes:
      'Phenytoin prodrug; concentration expressed as PHENYTOIN SODIUM EQUIVALENTS (PE) — verify units. ' +
      'Stock: 75 mg PE/mL; dilute to 1.5–25 mg PE/mL in NS or D5W. ' +
      'Maximum IV infusion rate: 150 mg PE/min (adults), 3 mg PE/kg/min (pediatrics). ' +
      'Less cardiovascular risk than phenytoin IV (safer for peripheral administration). ' +
      'Monitor ECG and BP during loading; hypotension common with rapid infusion. ' +
      'Paresthesias (groin/face tingling) during infusion — benign but alarming to patient. ' +
      'Therapeutic drug monitoring: target free phenytoin 1–2 mcg/mL or total 10–20 mcg/mL.',
  },
  {
    name: 'Hydromorphone',
    default_concentration: 0.2,
    min_concentration: 0.05,
    max_concentration: 1.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'HIGH ALERT — Potent opioid (~5× more potent than morphine); respiratory depression risk. ' +
      'Stock: 2 mg/mL, 4 mg/mL, or 10 mg/mL; dilute to 0.1–1 mg/mL for infusion. ' +
      'Use preservative-free formulation for intrathecal/epidural/neonatal use. ' +
      'Dose conversion: 1 mg hydromorphone IV ≈ 5 mg morphine IV (confirm with clinical pharmacist). ' +
      'Renal accumulation of active metabolite (hydromorphone-6-glucuronide) — use with caution in renal impairment. ' +
      'Reversal: naloxone 0.4–2 mg IV (titrate; shorter acting than hydromorphone — monitor for re-narcotization).',
  },
  {
    name: 'Levetiracetam',
    default_concentration: 5.0,
    min_concentration: 1.0,
    max_concentration: 15.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'Antiepileptic; second-line for neonatal seizures and first-line adjunct in pediatric epilepsy. ' +
      'Stock: 100 mg/mL; dilute to 5–15 mg/mL in 100 mL NS or D5W. ' +
      'Infuse over 15–30 min (loading doses of 60 mg/kg may be given over 15 min). ' +
      'Behavioral side effects: agitation, irritability — monitor. ' +
      'Renally cleared — dose-adjust for CrCl <80 mL/min. ' +
      'Fewer drug interactions than older antiepileptics (not a CYP inducer/inhibitor). ' +
      'No need for therapeutic drug monitoring in routine practice.',
  },

  // ═══════════════════════════════════════════════════════════
  //  STEROIDS
  // ═══════════════════════════════════════════════════════════

  {
    name: 'Dexamethasone',
    default_concentration: 1.0,
    min_concentration: 0.1,
    max_concentration: 10.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'Multiple formulations available (4 mg/mL, 10 mg/mL) — verify concentration before diluting. ' +
      'Some formulations contain benzyl alcohol or sulfites — use preservative-free for neonates/intrathecal use. ' +
      'NICU: low-dose post-natal steroid (DART protocol: 0.15 mg/kg/day) for ventilator dependence. ' +
      'Hyperglycemia and GI irritation common. ' +
      'Avoid with live vaccines. ' +
      'Adrenal suppression with prolonged use — structured taper required. ' +
      'Neonatal croup: 0.6 mg/kg single dose IM/IV (max 16 mg).',
  },
  {
    name: 'Hydrocortisone',
    default_concentration: 2.0,
    min_concentration: 0.5,
    max_concentration: 20.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'First-line corticosteroid for adrenal insufficiency and refractory septic shock. ' +
      'Stock (succinate): 100 mg/2 mL, 250 mg/2 mL; dilute to 1–2 mg/mL for IV infusion. ' +
      'Stress dosing (adrenal crisis): 50–100 mg IV bolus, then continuous infusion or q6–8h dosing. ' +
      'Neonatal relative adrenal insufficiency: 1–2 mg/kg/day IV in 2–4 divided doses. ' +
      'Hyperglycemia common — glucose monitoring required. ' +
      'Avoid mixing with heparin (incompatibility in same syringe).',
  },
  {
    name: 'Methylprednisolone',
    default_concentration: 2.5,
    min_concentration: 0.5,
    max_concentration: 20.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'Potent corticosteroid (~5× more potent than hydrocortisone per mg). ' +
      'Stock: Solu-Medrol 500 mg/vial, 1000 mg/vial; dilute to 0.5–2.5 mg/mL for IV infusion. ' +
      'Pulse dose for MS relapse/transplant rejection: 500–1000 mg infused over 30–60 min ' +
      '(rapid infusion associated with cardiac arrhythmias — use caution). ' +
      'Pediatric dosing varies by indication: anti-inflammatory 0.5–1 mg/kg; acute asthma 1–2 mg/kg/day. ' +
      'May cause acute pancreatitis, avascular necrosis with prolonged use. ' +
      'Hyperglycemia monitoring required.',
  },

  // ═══════════════════════════════════════════════════════════
  //  RESPIRATORY / NICU-SPECIFIC
  // ═══════════════════════════════════════════════════════════

  {
    name: 'Caffeine Citrate',
    default_concentration: 10.0,
    min_concentration: 5.0,
    max_concentration: 20.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'Methylxanthine — mainstay NICU treatment for apnea of prematurity. ' +
      'Available as 10 mg/mL premixed solution (caffeine citrate = 2× caffeine base concentration). ' +
      'Loading dose: 20 mg/kg caffeine citrate IV over 30 min. ' +
      'Maintenance: 5–10 mg/kg/day caffeine citrate. ' +
      'ALWAYS confirm which concentration is being ordered: caffeine CITRATE vs. caffeine BASE. ' +
      'Tachycardia and jitteriness are common; tachyarrhythmia risk at overdose. ' +
      'Therapeutic serum levels: 8–20 mg/L. ' +
      'Generally continued until 34–36 weeks postmenstrual age.',
  },
  {
    name: 'Alprostadil (PGE1)',
    default_concentration: 0.01,
    min_concentration: 0.002,
    max_concentration: 0.02,
    concentration_unit: 'mcg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'D5NS'],
    safety_notes:
      'CRITICAL NICU MEDICATION — Maintains ductal patency in ductal-dependent congenital heart disease. ' +
      'Stock: 500 mcg/mL (0.5 mg/mL); dilute significantly to 0.002–0.02 mcg/mL for neonatal infusion. ' +
      'Starting dose: 0.05–0.1 mcg/kg/min; titrate to effect (patent ductus verified by echo). ' +
      'Apnea is a common and serious side effect — have intubation equipment at bedside. ' +
      'Fever, vasodilation, and seizures may occur. ' +
      'Requires CENTRAL LINE or UAC for long-term infusion. ' +
      'Do NOT stop abruptly in ductal-dependent lesion — systemic or pulmonary collapse may result.',
  },
  {
    name: 'Furosemide',
    default_concentration: 1.0,
    min_concentration: 0.5,
    max_concentration: 10.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'Loop diuretic — IV bolus or continuous infusion for fluid overload. ' +
      'Stock: 10 mg/mL; dilute to 1–4 mg/mL for infusion. ' +
      'Administer at max rate 0.5 mg/kg/min (≤4 mg/min in adults) — rapid IV push causes ototoxicity. ' +
      'Ototoxicity risk increases with concurrent aminoglycosides — avoid combination or use caution. ' +
      'INCOMPATIBLE with milrinone (precipitation) and many drugs — flush line before and after. ' +
      'Monitor electrolytes (hypokalemia, hyponatremia, hypochloremic metabolic alkalosis) and renal function. ' +
      'Neonates: 0.5–2 mg/kg/dose q12–24h; may cause nephrocalcinosis with chronic use.',
  },
  {
    name: 'Bumetanide',
    default_concentration: 0.25,
    min_concentration: 0.05,
    max_concentration: 0.5,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'Loop diuretic — ~40× more potent than furosemide per mg. ' +
      'Stock: 0.25 mg/mL; further dilution may not always be required for bolus; dilute to 0.05–0.25 mg/mL for infusion. ' +
      'IV bolus: 0.01–0.1 mg/kg/dose over 1–2 min. Continuous infusion: 0.01–0.1 mg/kg/h. ' +
      'Same ototoxicity and electrolyte risks as furosemide. ' +
      'Useful in furosemide-resistant fluid overload (different binding site on Na-K-2Cl transporter). ' +
      'Neonates: investigational use in HIE (neonatal seizures) — consult neurology/pharmacy.',
  },

  // ═══════════════════════════════════════════════════════════
  //  GASTROINTESTINAL & OTHER
  // ═══════════════════════════════════════════════════════════

  {
    name: 'Ondansetron',
    default_concentration: 0.32,
    min_concentration: 0.16,
    max_concentration: 0.64,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W'],
    safety_notes:
      'Serotonin (5-HT3) antagonist antiemetic. ' +
      'Stock: 2 mg/mL; dilute to 0.16–0.64 mg/mL (e.g., 32 mg in 100 mL = 0.32 mg/mL) for infusion. ' +
      'Infuse over 15–30 min. ' +
      'QT prolongation risk — avoid in patients with congenital long QT syndrome; obtain baseline ECG. ' +
      'CONTRAINDICATED with apomorphine (severe hypotension). ' +
      'Serotonin syndrome risk with concurrent serotonergic agents. ' +
      'Neonates <1 month: use with caution (limited data); QT monitoring recommended.',
  },
  {
    name: 'Pantoprazole',
    default_concentration: 0.4,
    min_concentration: 0.4,
    max_concentration: 0.8,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W'],
    safety_notes:
      'Proton pump inhibitor — IV form for patients unable to take oral medications. ' +
      'Reconstitute 40 mg vial with 10 mL NS → 4 mg/mL; further dilute to 0.4–0.8 mg/mL. ' +
      'IV push: 40 mg over 2 min (adults). IV infusion: diluted solution over 15 min. ' +
      'Stress ulcer prophylaxis in ICU: 40 mg/day IV. GI bleeding: high-dose 80 mg bolus then 8 mg/h. ' +
      'INCOMPATIBLE with zinc-containing solutions and many drugs — flush line. ' +
      'Hypomagnesemia with chronic use (>1 year). ' +
      'Pediatric dosing by weight; NICU/neonatal evidence limited.',
  },
  {
    name: 'Acetylcysteine (IV)',
    default_concentration: 30.0,
    min_concentration: 3.0,
    max_concentration: 60.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['D5W', 'Normal Saline'],
    safety_notes:
      'Antidote for acetaminophen toxicity; also used for contrast nephropathy prophylaxis and as mucolytic. ' +
      'Stock: 200 mg/mL; dilute 150 mg/kg loading dose in 200 mL D5W, then 50 mg/kg in 500 mL, then 100 mg/kg in 1000 mL. ' +
      'Loading dose (150 mg/kg) must be infused over 60 min — previous 15-min protocol caused anaphylactoid reactions. ' +
      'Anaphylactoid reactions common (10–20%): rash, urticaria, bronchospasm — pretreatment controversial. ' +
      'If reaction occurs: stop infusion, treat symptoms, restart at slower rate after resolution. ' +
      'Use D5W in pediatrics; NS acceptable for adults.',
  },

  // ═══════════════════════════════════════════════════════════
  //  HEMATOLOGY / COAGULATION
  // ═══════════════════════════════════════════════════════════

  {
    name: 'Enoxaparin',
    default_concentration: 10.0,
    min_concentration: 5.0,
    max_concentration: 20.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'Sterile Water'],
    safety_notes:
      'LOW MOLECULAR WEIGHT HEPARIN — typically given subcutaneously; IV dosing used for VTE treatment in selected patients. ' +
      'Stock: 100 mg/mL prefilled syringe; dilute for IV infusion to 10–20 mg/mL if needed. ' +
      'Pediatric IV dosing varies by age and indication — weight-based, per institutional protocol. ' +
      'Monitor anti-Xa levels (therapeutic range: 0.5–1 unit/mL treatment; 0.2–0.5 unit/mL prophylaxis). ' +
      'ACCUMULATES in renal impairment (CrCl <30 mL/min) — dose-adjust or switch to unfractionated heparin. ' +
      'Neonates: higher dosing requirements due to reduced anti-Xa levels; monitor closely.',
  },
  {
    name: 'Protamine Sulfate',
    default_concentration: 5.0,
    min_concentration: 1.0,
    max_concentration: 10.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'HEPARIN ANTIDOTE — used to reverse systemic heparinization after cardiac surgery. ' +
      'Stock: 10 mg/mL; dilute to 5–10 mg/mL for slow IV infusion. ' +
      'NEVER inject rapidly — anaphylaxis, severe pulmonary vasoconstriction, cardiovascular collapse. ' +
      'Infuse over 10 min; MAX rate 5 mg/min. ' +
      'Allergic risk higher in fish-allergic patients and those previously exposed to protamine (NPH insulin). ' +
      'Protamine/heparin ratio: ~1 mg protamine per 100 units UFH administered in past 4 hours. ' +
      'Have epinephrine, diphenhydramine, and corticosteroids immediately available.',
  },
  {
    name: 'Alteplase (tPA)',
    default_concentration: 1.0,
    min_concentration: 0.1,
    max_concentration: 2.0,
    concentration_unit: 'mg/mL',
    common_diluent_names: ['Sterile Water', 'Normal Saline'],
    safety_notes:
      'HIGH ALERT — Thrombolytic agent; major bleeding risk. ' +
      'Reconstitute 50 mg or 100 mg vial with provided diluent to 1 mg/mL; further dilute to 0.1–0.5 mg/mL. ' +
      'Catheter clearance: 2 mg/2 mL instillation (low-dose); different from systemic dosing. ' +
      'Acute ischemic stroke: 0.9 mg/kg IV (max 90 mg); 10% as bolus, 90% over 60 min. ' +
      'Pulmonary embolism: 100 mg IV over 2 h. ' +
      'Absolute contraindications: active internal bleeding, intracranial hemorrhage, recent surgery. ' +
      'Requires independent double-check by two pharmacists or nurses at every step.',
  },

  // ═══════════════════════════════════════════════════════════
  //  ADDITIONAL ELECTROLYTES
  // ═══════════════════════════════════════════════════════════

  {
    name: 'Sodium Bicarbonate',
    default_concentration: 0.5,
    min_concentration: 0.5,
    max_concentration: 1.0,
    concentration_unit: 'mEq/mL',
    common_diluent_names: ['Sterile Water', 'D5W'],
    safety_notes:
      'HIGH ALERT — Hypertonic solution in concentrated forms. ' +
      'Available as 4.2% (0.5 mEq/mL), 7.5% (0.9 mEq/mL), and 8.4% (1 mEq/mL). ' +
      'NEONATES: use 0.5 mEq/mL (4.2%) formulation only — 8.4% is hyperosmolar and causes intraventricular hemorrhage risk. ' +
      'NEVER give undiluted 8.4% as rapid IV push in neonates — dilute 1:1 with SWFI or D5W. ' +
      'Incompatible with calcium solutions (immediate precipitation). ' +
      'Inactivates catecholamines (dopamine, epinephrine) — never mix in same line. ' +
      'Alkalosis risk with excessive dosing — monitor blood gases.',
  },
  {
    name: 'Sodium Phosphate',
    default_concentration: 0.5,
    min_concentration: 0.06,
    max_concentration: 1.0,
    concentration_unit: 'mEq/mL',
    common_diluent_names: ['Normal Saline', 'D5W', 'Sterile Water'],
    safety_notes:
      'HIGH ALERT — Concentrated phosphate: MUST be diluted before IV administration. ' +
      'Stock: 3 mmol phosphate (+ 4 mEq Na) per mL; dilute to 0.06–0.12 mmol/mL for infusion. ' +
      'Infuse at max 0.06 mmol/kg/h (moderate repletion) to 0.12 mmol/kg/h (severe repletion). ' +
      'NEVER mix with calcium-containing solutions — immediate calcium-phosphate precipitation. ' +
      'Hyperphosphatemia, hypocalcemia, hypotension risk with rapid infusion. ' +
      'TPN compatibility: verify calcium-phosphate solubility with pharmacy before compounding.',
  },
];

// ─── Main seed function ───────────────────────────────────────────────────────

function localNextId(collection: { id: number }[]): number {
  return collection.length === 0 ? 1 : Math.max(...collection.map(x => x.id)) + 1;
}

export function seedDatabase(db: SyncStore): void {
  // ── 1. Insert diluents that are not already present ───────────────────────
  for (const d of DILUENTS) {
    if (!db.data.diluents.find(x => x.name === d.name)) {
      db.data.diluents.push({ ...d, id: localNextId(db.data.diluents) });
    }
  }

  // ── 2. Build name → id map for resolving drug's common_diluents ──────────
  const diluentIdByName = new Map(db.data.diluents.map(d => [d.name, d.id]));

  const resolveIds = (names: string[]): string =>
    names
      .map(n => diluentIdByName.get(n))
      .filter((id): id is number => id !== undefined)
      .join(',');

  // ── 3. Insert drugs that are not already present ──────────────────────────
  for (const raw of DRUGS_RAW) {
    if (!db.data.drugs.find(x => x.name === raw.name)) {
      const { common_diluent_names, ...rest } = raw;
      db.data.drugs.push({
        ...rest,
        id: localNextId(db.data.drugs),
        common_diluents: resolveIds(common_diluent_names),
      });
    }
  }

  db.write();
}
