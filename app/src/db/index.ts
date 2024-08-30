import { Client } from "@openfeature/server-sdk";
import { Database, SeedData } from "./types";
import { PostgresDb } from "./postgres-db";
import { SqliteDb } from "./sqlite-db";

export { Database };

const seedData: SeedData = {
  colors: {
    mike: "red",
    dan: "green",
    todd: "blue",
    kim: "orange",
    tom: "purple",
    evan: "green",
    armin: "silver",
    georg: "turquoise",
  },
};

const postgres = new PostgresDb(seedData);
const sqlite = new SqliteDb(seedData);

export async function getConnection(
  featureFlagClient: Client
): Promise<Database> {
  const useDistributed = await featureFlagClient.getBooleanValue(
    "use-distributed-db",
    false
  );

  return useDistributed ? postgres : sqlite;
}
