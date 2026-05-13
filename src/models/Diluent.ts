export interface Diluent {
  id: number;
  name: string;
  concentration_percent: number;
  description: string | null;
  safety_notes: string | null;
}

export interface NewDiluent {
  name: string;
  concentration_percent: number;
  description?: string;
  safety_notes?: string;
}
