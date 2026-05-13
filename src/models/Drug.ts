export interface Drug {
  id: number;
  name: string;
  default_concentration: number | null;
  max_concentration: number | null;
  min_concentration: number | null;
  concentration_unit: string | null;
  common_diluents: string | null;
  safety_notes: string | null;
}

export interface NewDrug {
  name: string;
  default_concentration?: number;
  max_concentration?: number;
  min_concentration?: number;
  concentration_unit?: string;
  common_diluents?: string;
  safety_notes?: string;
}
