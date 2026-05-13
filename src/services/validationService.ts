import db from '../database/db';
import { Drug } from '../models/Drug';
import { Diluent } from '../models/Diluent';
import { DilutionInput, ValidationStatus } from '../models/Calculation';

export interface ValidationWarning {
  code: string;
  severity: 'WARN' | 'FAIL';
  message: string;
}

export interface ValidationResult {
  status: ValidationStatus;
  warnings: ValidationWarning[];
}

// ─── Individual validators ────────────────────────────────────────────────────

export function validateConcentrationRange(
  c1: number,
  c2: number,
  drugId?: number
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  if (c2 > c1) {
    warnings.push({
      code: 'CONC_EXCEEDS_INITIAL',
      severity: 'FAIL',
      message: `Final concentration (${c2}) cannot exceed initial concentration (${c1}); dilution only reduces concentration.`,
    });
  }

  if (c2 === c1) {
    warnings.push({
      code: 'CONC_UNCHANGED',
      severity: 'WARN',
      message: 'Initial and final concentrations are equal — no dilution is occurring.',
    });
  }

  if (drugId !== undefined) {
    const drug = db.data.drugs.find(d => d.id === drugId) as Drug | undefined;
    if (drug) {
      if (drug.max_concentration !== null && c2 > drug.max_concentration) {
        warnings.push({
          code: 'CONC_ABOVE_DRUG_MAX',
          severity: 'FAIL',
          message: `Final concentration (${c2}) exceeds the maximum safe concentration for ${drug.name} (${drug.max_concentration}).`,
        });
      }
      if (drug.min_concentration !== null && c2 < drug.min_concentration) {
        warnings.push({
          code: 'CONC_BELOW_DRUG_MIN',
          severity: 'WARN',
          message: `Final concentration (${c2}) is below the minimum effective concentration for ${drug.name} (${drug.min_concentration}). Verify therapeutic intent.`,
        });
      }
    }
  }

  return warnings;
}

export function validateDilutionRatio(c1: number, c2: number): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  if (c1 <= 0 || c2 <= 0) return warnings;

  const ratio = c1 / c2;

  if (ratio > 10) {
    warnings.push({
      code: 'RATIO_EXCESSIVE',
      severity: 'WARN',
      message: `Dilution ratio of 1:${ratio.toFixed(1)} exceeds 1:10. Verify the target concentration is intentional and that intermediate dilution steps are not required.`,
    });
  }

  if (ratio < 2) {
    warnings.push({
      code: 'RATIO_MINIMAL',
      severity: 'WARN',
      message: `Dilution ratio of 1:${ratio.toFixed(2)} is less than 1:2. This is a minimal dilution — confirm whether dilution is necessary.`,
    });
  }

  return warnings;
}

export function validateVolumes(v1: number, v2: number): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  const SMALL_VOL_THRESHOLD = 0.1;  // mL
  const LARGE_VOL_THRESHOLD = 1000; // mL
  const DECIMAL_PLACE_THRESHOLD = 2;

  if (v1 < SMALL_VOL_THRESHOLD) {
    warnings.push({
      code: 'VOL1_TOO_SMALL',
      severity: 'WARN',
      message: `Initial volume (${v1} mL) is less than ${SMALL_VOL_THRESHOLD} mL and may be difficult to measure accurately. Consider using a graduated syringe.`,
    });
  }

  if (v2 < SMALL_VOL_THRESHOLD) {
    warnings.push({
      code: 'VOL2_TOO_SMALL',
      severity: 'WARN',
      message: `Final volume (${v2} mL) is less than ${SMALL_VOL_THRESHOLD} mL and may be difficult to measure accurately. Consider using a graduated syringe.`,
    });
  }

  if (v1 > LARGE_VOL_THRESHOLD) {
    warnings.push({
      code: 'VOL1_UNUSUALLY_LARGE',
      severity: 'WARN',
      message: `Initial volume (${v1} mL) is unusually large (>${LARGE_VOL_THRESHOLD} mL). Verify units and intent.`,
    });
  }

  if (v2 > LARGE_VOL_THRESHOLD) {
    warnings.push({
      code: 'VOL2_UNUSUALLY_LARGE',
      severity: 'WARN',
      message: `Final volume (${v2} mL) is unusually large (>${LARGE_VOL_THRESHOLD} mL). Verify units and intent.`,
    });
  }

  for (const [label, vol] of [['Initial', v1], ['Final', v2]] as [string, number][]) {
    const decimalStr = vol.toString().split('.')[1];
    if (decimalStr && decimalStr.length > DECIMAL_PLACE_THRESHOLD) {
      const rounded = parseFloat(vol.toFixed(DECIMAL_PLACE_THRESHOLD));
      warnings.push({
        code: `${label === 'Initial' ? 'VOL1' : 'VOL2'}_IMPRECISE`,
        severity: 'WARN',
        message: `${label} volume (${vol} mL) has more than ${DECIMAL_PLACE_THRESHOLD} decimal places. Consider rounding to ${rounded} mL for practical measurement.`,
      });
    }
  }

  return warnings;
}

export function validateDiluentCompatibility(
  drugId: number,
  diluentId: number
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  const drug    = db.data.drugs.find(d => d.id === drugId)       as Drug    | undefined;
  const diluent = db.data.diluents.find(d => d.id === diluentId) as Diluent | undefined;

  if (!drug || !diluent) return warnings;

  if (!drug.common_diluents) {
    warnings.push({
      code: 'DILUENT_NO_COMPATIBILITY_DATA',
      severity: 'WARN',
      message: `No compatibility data available for ${drug.name}. Verify diluent selection against current formulary or pharmacist guidance.`,
    });
    return warnings;
  }

  const compatibleIds = drug.common_diluents
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));

  if (!compatibleIds.includes(diluentId)) {
    warnings.push({
      code: 'DILUENT_NOT_IN_COMMON_LIST',
      severity: 'WARN',
      message: `${diluent.name} is not in the common diluents list for ${drug.name}. Verify compatibility before use.`,
    });
  }

  return warnings;
}

// ─── Composite validator ──────────────────────────────────────────────────────

export interface ValidateCalculationOptions {
  input: DilutionInput;
  drugId?: number;
  diluentId?: number;
}

export function validateCalculation(options: ValidateCalculationOptions): ValidationResult {
  const { input, drugId, diluentId } = options;
  const warnings: ValidationWarning[] = [];

  if (input.type === 'c1v1') {
    const { c1, c2, v1, v2 } = input;

    if (c1 !== undefined && c2 !== undefined) {
      warnings.push(...validateConcentrationRange(c1, c2, drugId));
      warnings.push(...validateDilutionRatio(c1, c2));
    }

    if (v1 !== undefined && v2 !== undefined) {
      warnings.push(...validateVolumes(v1, v2));
    }
  }

  if (input.type === 'serial') {
    const { initialConcentration, dilutionFactor, steps } = input;

    if (initialConcentration !== undefined && dilutionFactor !== undefined && steps !== undefined) {
      const finalConc = initialConcentration / Math.pow(dilutionFactor, steps);
      warnings.push(...validateConcentrationRange(initialConcentration, finalConc, drugId));

      // Each step is the same dilution ratio
      if (dilutionFactor > 10) {
        warnings.push({
          code: 'SERIAL_FACTOR_EXCESSIVE',
          severity: 'WARN',
          message: `Serial dilution factor of 1:${dilutionFactor} per step is unusually high. Confirm this is intentional.`,
        });
      }
    }
  }

  if (input.type === 'percent') {
    const { soluteMass, solventVolume } = input;

    if (solventVolume !== undefined) {
      warnings.push(...validateVolumes(0, solventVolume).filter((w) => w.code.startsWith('VOL2')));
    }

    if (soluteMass !== undefined && solventVolume !== undefined && solventVolume > 0) {
      const percent = (soluteMass / solventVolume) * 100;
      if (percent > 50) {
        warnings.push({
          code: 'PERCENT_VERY_HIGH',
          severity: 'WARN',
          message: `Calculated percent solution (${percent.toFixed(2)}%) is greater than 50% w/v. Verify solubility limits for the intended solute.`,
        });
      }
    }
  }

  if (drugId !== undefined && diluentId !== undefined) {
    warnings.push(...validateDiluentCompatibility(drugId, diluentId));
  }

  const status: ValidationStatus = warnings.some((w) => w.severity === 'FAIL')
    ? 'FAIL'
    : warnings.length > 0
    ? 'WARN'
    : 'PASS';

  return { status, warnings };
}
