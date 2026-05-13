import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Must be set before any module that imports db.ts is loaded
const TEST_DB = path.join(os.tmpdir(), `pharmacy-test-${process.pid}.json`);
process.env.DB_PATH = TEST_DB;

import {
  validateConcentrationRange,
  validateDilutionRatio,
  validateVolumes,
  validateCalculation,
} from '../src/services/validationService';

afterAll(() => {
  try { fs.unlinkSync(TEST_DB); } catch { /* already gone */ }
});

describe('validateConcentrationRange', () => {
  it('FAILs when c2 > c1', () => {
    const warnings = validateConcentrationRange(5, 10);
    expect(warnings).toContainEqual(expect.objectContaining({ code: 'CONC_EXCEEDS_INITIAL', severity: 'FAIL' }));
  });

  it('WARNs when c2 === c1', () => {
    const warnings = validateConcentrationRange(5, 5);
    expect(warnings).toContainEqual(expect.objectContaining({ code: 'CONC_UNCHANGED', severity: 'WARN' }));
  });

  it('passes when c2 < c1', () => {
    const warnings = validateConcentrationRange(10, 1);
    expect(warnings).toHaveLength(0);
  });
});

describe('validateDilutionRatio', () => {
  it('WARNs on ratio >1:10', () => {
    const warnings = validateDilutionRatio(100, 5); // 1:20
    expect(warnings).toContainEqual(expect.objectContaining({ code: 'RATIO_EXCESSIVE' }));
  });

  it('WARNs on ratio <1:2', () => {
    const warnings = validateDilutionRatio(10, 8); // 1:1.25
    expect(warnings).toContainEqual(expect.objectContaining({ code: 'RATIO_MINIMAL' }));
  });

  it('passes for ratio between 1:2 and 1:10', () => {
    const warnings = validateDilutionRatio(10, 2); // 1:5
    expect(warnings).toHaveLength(0);
  });

  it('returns no warnings when c1 is zero', () => {
    expect(validateDilutionRatio(0, 5)).toHaveLength(0);
  });
});

describe('validateVolumes', () => {
  it('WARNs when v1 < 0.1 mL', () => {
    const warnings = validateVolumes(0.05, 10);
    expect(warnings).toContainEqual(expect.objectContaining({ code: 'VOL1_TOO_SMALL' }));
  });

  it('WARNs when v2 < 0.1 mL', () => {
    const warnings = validateVolumes(10, 0.05);
    expect(warnings).toContainEqual(expect.objectContaining({ code: 'VOL2_TOO_SMALL' }));
  });

  it('WARNs when v1 > 1000 mL', () => {
    const warnings = validateVolumes(1500, 100);
    expect(warnings).toContainEqual(expect.objectContaining({ code: 'VOL1_UNUSUALLY_LARGE' }));
  });

  it('WARNs when v2 > 1000 mL', () => {
    const warnings = validateVolumes(100, 2000);
    expect(warnings).toContainEqual(expect.objectContaining({ code: 'VOL2_UNUSUALLY_LARGE' }));
  });

  it('WARNs when volume has >2 decimal places', () => {
    const warnings = validateVolumes(3.733, 10);
    expect(warnings).toContainEqual(expect.objectContaining({ code: 'VOL1_IMPRECISE' }));
  });

  it('passes for clean volumes in normal range', () => {
    const warnings = validateVolumes(5, 50);
    expect(warnings).toHaveLength(0);
  });
});

describe('validateCalculation (composite)', () => {
  it('returns PASS for a clean c1v1 input', () => {
    const result = validateCalculation({
      input: { type: 'c1v1', c1: 10, v1: 5, c2: 2, v2: 25 },
    });
    expect(result.status).toBe('PASS');
    expect(result.warnings).toHaveLength(0);
  });

  it('returns FAIL when c2 > c1', () => {
    const result = validateCalculation({
      input: { type: 'c1v1', c1: 2, v1: 5, c2: 10, v2: 1 },
    });
    expect(result.status).toBe('FAIL');
  });

  it('returns WARN for excessive dilution ratio', () => {
    const result = validateCalculation({
      input: { type: 'c1v1', c1: 100, v1: 1, c2: 1, v2: 100 },
    });
    expect(result.status).toBe('WARN');
    expect(result.warnings.some((w) => w.code === 'RATIO_EXCESSIVE')).toBe(true);
  });

  it('returns PASS for a clean serial dilution', () => {
    const result = validateCalculation({
      input: { type: 'serial', initialConcentration: 1000, dilutionFactor: 10, steps: 3 },
    });
    expect(result.status).toBe('PASS');
  });

  it('WARNs on serial dilution factor >10', () => {
    const result = validateCalculation({
      input: { type: 'serial', initialConcentration: 1000, dilutionFactor: 20, steps: 2 },
    });
    expect(result.warnings.some((w) => w.code === 'SERIAL_FACTOR_EXCESSIVE')).toBe(true);
  });

  it('WARNs on percent solution >50%', () => {
    const result = validateCalculation({
      input: { type: 'percent', soluteMass: 60, solventVolume: 100 },
    });
    expect(result.warnings.some((w) => w.code === 'PERCENT_VERY_HIGH')).toBe(true);
  });
});
