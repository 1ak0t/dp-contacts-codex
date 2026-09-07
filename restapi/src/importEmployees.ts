import { parse } from "csv-parse/sync";
import type { Collection } from "mongodb";
import type { Employee } from "./types.js";

type EmployeeDocument = Omit<Employee, "id">;
const fields = ["fio", "op", "orgUnit", "jobTitle", "phoneNumber", "persEmail", "jobType", "email"] as const;

export function parseEmployeesCsv(input: Uint8Array): EmployeeDocument[] {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(input);
  const rows: Record<string, string>[] = parse(text, {
    bom: true,
    skip_empty_lines: true,
    columns(headers: string[]) {
      if (headers.length !== fields.length || fields.some(field => !headers.includes(field))) {
        throw new Error(`CSV должен содержать колонки: ${fields.join(",")}`);
      }
      return headers;
    },
  });
  if (!rows.length) throw new Error("CSV не содержит контактов.");
  return rows.map((row, index) => {
    if (!row.fio.trim()) throw new Error(`Запись ${index + 1}: пустое ФИО.`);
    return Object.fromEntries(fields.map(field => [field, row[field]])) as EmployeeDocument;
  });
}

export async function importEmployees(collection: Collection<EmployeeDocument>, employees: EmployeeDocument[]) {
  let inserted = 0;
  let skipped = 0;
  // Ordered upserts also skip identical rows within the same file.
  for (let offset = 0; offset < employees.length; offset += 500) {
    const result = await collection.bulkWrite(employees.slice(offset, offset + 500).map(employee => ({
      updateOne: { filter: employee, update: { $setOnInsert: employee }, upsert: true },
    })), { ordered: true });
    inserted += result.upsertedCount;
    skipped += result.matchedCount;
  }
  return { inserted, skipped };
}
