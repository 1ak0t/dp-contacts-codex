import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";
import { config } from "../config.js";
import { importEmployees, parseEmployeesCsv } from "../importEmployees.js";
import type { Employee } from "../types.js";

let client: MongoClient | undefined;
try {
  const args = process.argv.slice(2);
  const paths = args.filter(arg => arg !== "--dry-run");
  if (paths.length > 1 || paths.some(arg => arg.startsWith("--"))) {
    throw new Error('Использование: npm run import:csv -- ["путь.csv"] [--dry-run]');
  }
  const path = paths[0] ? resolve(paths[0]) : fileURLToPath(new URL("../../../дп-данные.csv", import.meta.url));
  const employees = parseEmployeesCsv(await readFile(path));
  console.log(`CSV проверен: ${employees.length} записей. База: ${config.mongoDbName}, коллекция: employees.`);
  if (args.includes("--dry-run")) {
    console.log("Проверка завершена без подключения к MongoDB и записи данных.");
  } else {
    client = new MongoClient(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const collection = client.db(config.mongoDbName).collection<Omit<Employee, "id">>("employees");
    const result = await importEmployees(collection, employees);
    console.log(`Добавлено: ${result.inserted}. Полных совпадений пропущено: ${result.skipped}.`);
  }
} catch (error) {
  // Do not print document contents or a connection URI containing credentials.
  console.error(`Импорт не завершён (${error instanceof Error ? error.name : "Error"}). Проверьте CSV, путь и настройки MongoDB. При ошибке записи часть данных могла сохраниться; повторный запуск пропустит полные совпадения.`);
  process.exitCode = 1;
} finally {
  await client?.close();
}
