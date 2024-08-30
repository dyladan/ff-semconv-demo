export interface Database {
  get(table: string, id: string): Promise<string | null>;
  list(table: string): Promise<string[]>;
}

export type SeedData = { [table: string]: { [name: string]: string } };
