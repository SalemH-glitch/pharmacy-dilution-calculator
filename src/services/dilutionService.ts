import { DilutionInput, DilutionResult } from '../models/Calculation';

export function calculate(input: DilutionInput): DilutionResult {
  switch (input.type) {
    case 'c1v1':
      return solveC1V1(input);
    case 'serial':
      return solveSerial(input);
    case 'percent':
      return solvePercent(input);
    default:
      throw new Error('Unknown calculation type');
  }
}

function solveC1V1(input: DilutionInput): DilutionResult {
  const { c1, v1, c2, v2 } = input;
  const knowns = [c1, v1, c2, v2].filter((v) => v !== undefined && v !== null);
  if (knowns.length !== 3) {
    throw new Error('Exactly 3 of c1, v1, c2, v2 must be provided');
  }

  let result: number;
  let label: string;

  if (c1 === undefined) {
    result = (c2! * v2!) / v1!;
    label = 'c1 (initial concentration)';
  } else if (v1 === undefined) {
    result = (c2! * v2!) / c1;
    label = 'v1 (initial volume)';
  } else if (c2 === undefined) {
    result = (c1 * v1) / v2!;
    label = 'c2 (final concentration)';
  } else {
    result = (c1 * v1) / c2;
    label = 'v2 (final volume)';
  }

  return {
    type: 'c1v1',
    result,
    unit: 'depends on input units',
    steps: [`C1V1 = C2V2 solved for ${label}`, `Result: ${result}`],
  };
}

function solveSerial(input: DilutionInput): DilutionResult {
  const { initialConcentration, dilutionFactor, steps } = input;
  if (initialConcentration === undefined || dilutionFactor === undefined || steps === undefined) {
    throw new Error('initialConcentration, dilutionFactor, and steps are required for serial dilution');
  }
  if (dilutionFactor <= 0) throw new Error('dilutionFactor must be positive');
  if (steps < 1) throw new Error('steps must be at least 1');

  const concentrations: number[] = [];
  const descriptions: string[] = [`Step 0: ${initialConcentration}`];

  for (let i = 1; i <= steps; i++) {
    const c = initialConcentration / Math.pow(dilutionFactor, i);
    concentrations.push(c);
    descriptions.push(`Step ${i}: ${c.toExponential(4)}`);
  }

  return {
    type: 'serial',
    result: concentrations,
    unit: 'same as input concentration',
    steps: descriptions,
  };
}

function solvePercent(input: DilutionInput): DilutionResult {
  const { soluteMass, solventVolume } = input;
  if (soluteMass === undefined || solventVolume === undefined) {
    throw new Error('soluteMass and solventVolume are required for percent solution');
  }
  if (solventVolume <= 0) throw new Error('solventVolume must be positive');

  const result = (soluteMass / solventVolume) * 100;

  return {
    type: 'percent',
    result,
    unit: '% (w/v)',
    steps: [
      `% (w/v) = (soluteMass / solventVolume) × 100`,
      `= (${soluteMass} / ${solventVolume}) × 100`,
      `= ${result}%`,
    ],
  };
}
