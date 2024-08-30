import { Database, SeedData } from "./types";

/**
 * Pretends to be a distributed database.
 * Latency is not as good as local files, but concurrent access is unrestrained.
 */
export abstract class BaseDb implements Database {
  protected _data = new Map<string, Map<string, string>>();

  constructor(seedData: SeedData) {
    for (const table of Object.getOwnPropertyNames(seedData)) {
      if (!this._data.has(table)) this._data.set(table, new Map());
      for (const id of Object.getOwnPropertyNames(seedData[table])) {
        this._data.get(table)?.set(id, seedData[table][id]);
      }
    }
  }

  abstract get(table: string, id: string): Promise<string | null>;
  abstract list(table: string): Promise<string[]>;

  protected _get(table: string, id: string): string | null {
    const tableData = this._data.get(table);
    if (tableData == null) {
      throw new Error(`Table not found - ${table}`);
    }
    return tableData.get(id) ?? null;
  }

  protected _list(table: string): string[] {
    const tableData = this._data.get(table);
    if (tableData == null) {
      throw new Error(`Table not found - ${table}`);
    }
    return Array.from(tableData.keys());
  }
}
