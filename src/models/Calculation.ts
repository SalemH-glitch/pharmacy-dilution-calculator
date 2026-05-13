export type CalculationType = 'c1v1' | 'serial' | 'percent';

export interface DilutionInput {
  type: CalculationType;
  unit?: string;
  // C1V1=C2V2
  c1?: number;
  v1?: number;
  c2?: number;
  v2?: number;
  // Serial dilution
  initialConcentration?: number;
  dilutionFactor?: number;
  steps?: number;
  // Percent solution
  soluteMass?: number;
  solventVolume?: number;
}

export interface DilutionResult {
  type: CalculationType;
  result: number | number[];
  unit: string;
  steps?: string[];
}

export type ValidationStatus = 'PASS' | 'WARN' | 'FAIL';

export interface Calculation {
  id: number;
  user_id: number;
  type: string;
  input: string;
  result: string;
  user_signature: string | null;
  drug_id: number | null;
  drug_name_manual: string | null;
  diluent_id: number | null;
  intended_use: string | null;
  patient_context: string | null;
  validation_status: ValidationStatus | null;
  warnings_json: string | null;
  notes: string | null;
  created_at: string;
}

export interface NewCalculation {
  user_id: number;
  type: string;
  input: string;
  result: string;
  user_signature?: string;
  drug_id?: number;
  drug_name_manual?: string;
  diluent_id?: number;
  intended_use?: string;
  patient_context?: string;
  validation_status?: ValidationStatus;
  warnings_json?: string;
  notes?: string;
}
