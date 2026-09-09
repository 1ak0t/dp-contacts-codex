import type { Employee, EmployeeForm, ColumnKey } from "./types";
import { employeeFormFields, emptyEmployeeForm } from "./employeeConfig";

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const normalizedDigits = digits[0] === "8" ? `7${digits.slice(1)}` : digits;
  const withoutCountry = normalizedDigits.startsWith("7") ? normalizedDigits.slice(1, 11) : normalizedDigits.slice(0, 10);

  return `+7${withoutCountry}`;
}

export function formatPhone(value: string): string {
  const normalizedPhone = normalizePhone(value);
  const digits = normalizedPhone.slice(2);
  const parts = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 8),
    digits.slice(8, 10),
  ].filter(Boolean);

  return parts.length > 0 ? `+7-${parts.join("-")}` : normalizedPhone;
}

export function getEmployeeForm(employee: Employee): EmployeeForm {
  return employeeFormFields.reduce<EmployeeForm>((form, field) => {
    const value = String(employee[field] || "");
    form[field] = field === "phoneNumber" ? formatPhone(value) : value;
    return form;
  }, { ...emptyEmployeeForm });
}

export function getEmployeeEmail(employee: Employee): string {
  return String(employee.email || employee.persEmail || "");
}

export function getColumnValue(employee: Employee, key: ColumnKey): string {
  return key === "email" ? getEmployeeEmail(employee) : String(employee[key] || "");
}

export function uniqueValues(data: Employee[], key: ColumnKey): string[] {
  return Array.from(new Set(data.map((item) => getColumnValue(item, key)).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "ru", { sensitivity: "base" }),
  );
}

