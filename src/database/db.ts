/**
 * db.ts — lightweight synchronous JSON file store.
 *
 * Replaces better-sqlite3 with plain Node.js fs so the project has zero
 * native-compilation dependencies and works on any system immediately after
 * `npm install`.
 *
 * API is intentionally lowdb-compatible (db.data, db.read(), db.write()) so
 * all call sites read the same way they would with lowdb, without the ESM
 * incompatibility that lowdb v7 introduces into a CommonJS TypeScript project.
 */

import fs from 'fs';
import path from 'path';
import type { DbSchema } from './schema';
import { seedDatabase } from './seedData';

export type { DbSchema };

// ─── Minimal lowdb-compatible sync store ─────────────────────────────────────

class JsonStore<T extends object> {
  data: T;

  constructor(
    private readonly filePath: string,
    private readonly defaults: T,
  ) {
    this.data = this.clone(defaults);
    this.read();
  }

  read(): void {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      this.data = JSON.parse(raw) as T;
    } catch {
      // File missing or unparseable — start fresh and persist the defaults
      this.data = this.clone(this.defaults);
      this.write();
    }
  }

  write(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  private clone(obj: T): T {
    return JSON.parse(JSON.stringify(obj)) as T;
  }
}

// ─── Singleton instance ───────────────────────────────────────────────────────

const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, '../../db.json');

const db = new JsonStore<DbSchema>(DB_PATH, {
  users:        [],
  diluents:     [],
  drugs:        [],
  calculations: [],
});

// ─── Helpers used by services and routes ─────────────────────────────────────

/** Returns the next auto-increment ID for any collection. */
export function nextId(collection: { id: number }[]): number {
  return collection.length === 0 ? 1 : Math.max(...collection.map(x => x.id)) + 1;
}

/** Current UTC timestamp as a full ISO-8601 string. */
export function nowIso(): string {
  return new Date().toISOString();
}

seedDatabase(db);

export default db;
