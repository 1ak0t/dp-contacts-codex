import { Router } from "express";
import bcrypt from "bcryptjs";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createEmployee, deleteEmployee, listEmployees, listOperations, revokeEmployeeAdmin, setEmployeeAdminPassword, updateEmployee } from "../repositories/employeesRepository.js";
import type { Employee } from "../types.js";

export const contactsRouter = Router();

type EmployeeInput = Pick<Employee, "fio" | "op" | "orgUnit" | "jobTitle" | "phoneNumber" | "innerPhone" | "persEmail" | "jobType" | "email">;
type EmployeeInputField = keyof EmployeeInput;

const requiredFields: EmployeeInputField[] = ["fio", "op", "orgUnit", "jobTitle", "phoneNumber", "jobType"];
const allFields: EmployeeInputField[] = [
  "fio",
  "op",
  "orgUnit",
  "jobTitle",
  "phoneNumber",
  "innerPhone",
  "persEmail",
  "jobType",
  "email",
];
const phoneRegex = /^\+7\d{10}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const normalizedDigits = digits[0] === "8" ? `7${digits.slice(1)}` : digits;
  const withoutCountry = normalizedDigits.startsWith("7") ? normalizedDigits.slice(1, 11) : normalizedDigits.slice(0, 10);

  return `+7${withoutCountry}`;
}

function normalizeEmployeeInput(body: unknown): EmployeeInput {
  if (!body || typeof body !== "object") {
    throw new Error("Employee data is required");
  }

  const source = body as Record<string, unknown>;

  return allFields.reduce<EmployeeInput>((employee, field) => {
    const value = source[field];
    const normalizedValue = typeof value === "string" ? value.trim() : "";
    employee[field] = field === "phoneNumber" ? normalizePhone(normalizedValue) : normalizedValue;
    return employee;
  }, {} as EmployeeInput);
}

function readPassword(body: unknown): string {
  const password = body && typeof body === "object" ? (body as Record<string, unknown>).password : "";

  if (typeof password !== "string" || password.length < 8) {
    throw new Error("Password must contain at least 8 characters");
  }

  return password;
}

async function validateEmployee(employee: EmployeeInput): Promise<string[]> {
  const errors: string[] = [];

  for (const field of requiredFields) {
    if (!employee[field]) {
      errors.push(`${field} is required`);
    }
  }

  if (employee.phoneNumber && !phoneRegex.test(employee.phoneNumber)) {
    errors.push("phoneNumber must match +7xxxxxxxxxx or +7-xxx-xxx-xx-xx");
  }

  if (employee.email && !emailRegex.test(employee.email)) {
    errors.push("email is invalid");
  }

  if (employee.persEmail && !emailRegex.test(employee.persEmail)) {
    errors.push("persEmail is invalid");
  }

  const operations = await listOperations();
  if (employee.op && !operations.includes(employee.op)) {
    errors.push("op must be one of existing values");
  }

  return errors;
}

contactsRouter.get("/", async (_request, response, next) => {
  try {
    response.json({ employees: await listEmployees() });
  } catch (error) {
    next(error);
  }
});

contactsRouter.post("/", authMiddleware, async (request, response, next) => {
  try {
    const employee = normalizeEmployeeInput(request.body);
    const errors = await validateEmployee(employee);

    if (errors.length > 0) {
      return response.status(400).json({ message: "Validation failed", errors });
    }

    return response.status(201).json({ employee: await createEmployee(employee) });
  } catch (error) {
    next(error);
  }
});

contactsRouter.put("/:id", authMiddleware, async (request, response, next) => {
  try {
    const id = String(request.params.id);
    const employee = normalizeEmployeeInput(request.body);
    const errors = await validateEmployee(employee);

    if (errors.length > 0) {
      return response.status(400).json({ message: "Validation failed", errors });
    }

    const updatedEmployee = await updateEmployee(id, employee);

    if (!updatedEmployee) {
      return response.status(404).json({ message: "Employee not found" });
    }

    return response.json({ employee: updatedEmployee });
  } catch (error) {
    next(error);
  }
});

contactsRouter.post("/:id/admin", authMiddleware, async (request, response, next) => {
  try {
    const id = String(request.params.id);
    const password = readPassword(request.body);
    const passwordHash = await bcrypt.hash(password, 10);
    const employee = await setEmployeeAdminPassword(id, passwordHash);

    if (!employee) {
      return response.status(404).json({ message: "Employee not found or has no corporate email" });
    }

    return response.json({ employee });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Password")) {
      return response.status(400).json({ message: error.message });
    }

    next(error);
  }
});

contactsRouter.post("/:id/admin/reset-password", authMiddleware, async (request, response, next) => {
  try {
    const id = String(request.params.id);
    const password = readPassword(request.body);
    const passwordHash = await bcrypt.hash(password, 10);
    const employee = await setEmployeeAdminPassword(id, passwordHash);

    if (!employee) {
      return response.status(404).json({ message: "Employee not found or has no corporate email" });
    }

    return response.json({ employee });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Password")) {
      return response.status(400).json({ message: error.message });
    }

    next(error);
  }
});

contactsRouter.delete("/:id/admin", authMiddleware, async (request, response, next) => {
  try {
    const id = String(request.params.id);
    const employee = await revokeEmployeeAdmin(id);

    if (!employee) {
      return response.status(404).json({ message: "Employee not found" });
    }

    return response.json({ employee });
  } catch (error) {
    next(error);
  }
});

contactsRouter.delete("/:id", authMiddleware, async (request, response, next) => {
  try {
    const id = String(request.params.id);
    const isDeleted = await deleteEmployee(id);

    if (!isDeleted) {
      return response.status(404).json({ message: "Employee not found" });
    }

    return response.status(204).send();
  } catch (error) {
    next(error);
  }
});
