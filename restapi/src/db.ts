import { MongoClient } from "mongodb";
import { config } from "./config.js";

const client = new MongoClient(config.mongoUri);

let connection: Promise<MongoClient> | null = null;

export async function getDb() {
  connection ??= client.connect();
  return (await connection).db(config.mongoDbName);
}

export async function closeDbConnection() {
  if (!connection) {
    return;
  }

  await client.close();
  connection = null;
}
