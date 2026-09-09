import { ObjectId, type Collection, type OptionalId } from "mongodb";
import { getDb } from "../db.js";
import type { Employee } from "../types.js";

type EmployeeDocument = Omit<Employee, "id">;

const collectionName = "employees";

async function getEmployeesCollection(): Promise<Collection<EmployeeDocument>> {
  return (await getDb()).collection<EmployeeDocument>(collectionName);
}

function toEmployee({ _id, adminPasswordHash, ...employee }: EmployeeDocument & { _id: ObjectId }): Employee {
  void adminPasswordHash;
  return {
    id: _id.toString(),
    ...employee,
    innerPhone: employee.innerPhone ?? "",
    isAdmin: Boolean(employee.isAdmin),
  };
}

export async function listEmployees(): Promise<Employee[]> {
  const employees = await (await getEmployeesCollection())
    .find({}, { sort: { fio: 1 } })
    .toArray();

  return employees.map(toEmployee);
}

export async function findAdminByEmail(email: string): Promise<(EmployeeDocument & { _id: ObjectId }) | null> {
  return (await getEmployeesCollection()).findOne({
    email,
    isAdmin: true,
    adminPasswordHash: { $type: "string" },
  }) as Promise<(EmployeeDocument & { _id: ObjectId }) | null>;
}

export async function isEmployeeAdmin(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) {
    return false;
  }

  const count = await (await getEmployeesCollection()).countDocuments({
    _id: new ObjectId(id),
    isAdmin: true,
    adminPasswordHash: { $type: "string" },
  }, { limit: 1 });

  return count === 1;
}

export async function listOperations(): Promise<string[]> {
  const values = await (await getEmployeesCollection()).distinct("op");
  return values.filter((value): value is string => typeof value === "string" && value.length > 0);
}

export async function createEmployee(employee: EmployeeDocument): Promise<Employee> {
  const collection = await getEmployeesCollection();
  const result = await collection.insertOne(employee);

  return {
    id: result.insertedId.toString(),
    ...employee,
  };
}

export async function updateEmployee(id: string, employee: EmployeeDocument): Promise<Employee | null> {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const _id = new ObjectId(id);
  const collection = await getEmployeesCollection();
  const result = await collection.findOneAndUpdate({ _id }, { $set: employee }, { returnDocument: "after" });

  if (!result) {
    return null;
  }

  return toEmployee(result as EmployeeDocument & { _id: ObjectId });
}

export async function setEmployeeAdminPassword(id: string, passwordHash: string): Promise<Employee | null> {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const result = await (await getEmployeesCollection()).findOneAndUpdate(
    { _id: new ObjectId(id), email: { $type: "string", $ne: "" } },
    { $set: { isAdmin: true, adminPasswordHash: passwordHash } },
    { returnDocument: "after" },
  );

  return result ? toEmployee(result as EmployeeDocument & { _id: ObjectId }) : null;
}

export async function revokeEmployeeAdmin(id: string): Promise<Employee | null> {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const result = await (await getEmployeesCollection()).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $unset: { isAdmin: "", adminPasswordHash: "" } },
    { returnDocument: "after" },
  );

  return result ? toEmployee(result as EmployeeDocument & { _id: ObjectId }) : null;
}

export async function deleteEmployee(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) {
    return false;
  }

  const result = await (await getEmployeesCollection()).deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

export async function replaceEmployees(employees: EmployeeDocument[]): Promise<number> {
  const collection = await getEmployeesCollection();
  await collection.deleteMany({});

  if (employees.length === 0) {
    return 0;
  }

  const result = await collection.insertMany(employees as OptionalId<EmployeeDocument>[]);
  await collection.createIndex({ fio: 1 });
  await collection.createIndex({ op: 1 });
  await collection.createIndex({ phoneNumber: 1 });

  return result.insertedCount;
}
