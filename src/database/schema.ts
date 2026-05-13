// Shared schema type used by both db.ts and seedData.ts.
// Kept in its own file to prevent circular imports.
import { User } from '../models/User';
import { Diluent } from '../models/Diluent';
import { Drug } from '../models/Drug';
import { Calculation } from '../models/Calculation';

export interface DbSchema {
  users: User[];
  diluents: Diluent[];
  drugs: Drug[];
  calculations: Calculation[];
}
