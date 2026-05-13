import { calculate } from '../src/services/dilutionService';

describe('C1V1 = C2V2', () => {
  it('solves for c2', () => {
    const result = calculate({ type: 'c1v1', c1: 10, v1: 5, v2: 50 });
    expect(result.result).toBeCloseTo(1);
  });

  it('solves for v2', () => {
    const result = calculate({ type: 'c1v1', c1: 10, v1: 5, c2: 2 });
    expect(result.result).toBeCloseTo(25);
  });

  it('solves for c1', () => {
    const result = calculate({ type: 'c1v1', v1: 5, c2: 2, v2: 25 });
    expect(result.result).toBeCloseTo(10);
  });

  it('solves for v1', () => {
    const result = calculate({ type: 'c1v1', c1: 10, c2: 2, v2: 25 });
    expect(result.result).toBeCloseTo(5);
  });

  it('throws when fewer than 3 values provided', () => {
    expect(() => calculate({ type: 'c1v1', c1: 10, v1: 5 })).toThrow();
  });
});

describe('Serial dilution', () => {
  it('computes correct concentrations', () => {
    const result = calculate({
      type: 'serial',
      initialConcentration: 1000,
      dilutionFactor: 10,
      steps: 3,
    });
    const concentrations = result.result as number[];
    expect(concentrations).toHaveLength(3);
    expect(concentrations[0]).toBeCloseTo(100);
    expect(concentrations[1]).toBeCloseTo(10);
    expect(concentrations[2]).toBeCloseTo(1);
  });

  it('throws on invalid dilution factor', () => {
    expect(() =>
      calculate({ type: 'serial', initialConcentration: 100, dilutionFactor: 0, steps: 3 })
    ).toThrow();
  });
});

describe('Percent solution', () => {
  it('calculates w/v percent correctly', () => {
    const result = calculate({ type: 'percent', soluteMass: 5, solventVolume: 100 });
    expect(result.result).toBeCloseTo(5);
    expect(result.unit).toBe('% (w/v)');
  });

  it('throws on zero volume', () => {
    expect(() =>
      calculate({ type: 'percent', soluteMass: 5, solventVolume: 0 })
    ).toThrow();
  });
});
