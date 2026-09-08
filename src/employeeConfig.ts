import type { ColumnKey, EmployeeForm } from "./types";

export const columns: Array<{ key: ColumnKey; label: string }> = [
  { key: "op", label: "ОП" },
  { key: "fio", label: "ФИО" },
  { key: "jobTitle", label: "Должность" },
  { key: "phoneNumber", label: "Телефон" },
  { key: "email", label: "E-Mail" },
];

export const filterColumns = columns.filter((column) => column.key === "op");

export const employeeFormLabels: Record<keyof EmployeeForm, string> = {
  op: "ОП",
  fio: "ФИО",
  jobTitle: "Должность",
  orgUnit: "Подразделение",
  phoneNumber: "Мобильный телефон",
  innerPhone: "Внутренний телефон",
  email: "Корпоративный E-Mail",
  persEmail: "Личный E-Mail",
  jobType: "Форма занятости",
};

export const employeeFormFields: Array<keyof EmployeeForm> = [
  "op", "fio", "jobTitle", "orgUnit", "phoneNumber", "innerPhone", "email", "persEmail", "jobType",
];
export const requiredEmployeeFields: Array<keyof EmployeeForm> = ["fio", "op", "orgUnit", "jobTitle", "phoneNumber", "jobType"];
export const emptyEmployeeForm: EmployeeForm = {
  fio: "",
  op: "",
  orgUnit: "",
  jobTitle: "",
  phoneNumber: "",
  innerPhone: "",
  persEmail: "",
  jobType: "",
  email: "",
};
export const phoneRegex = /^\+7\d{10}$/;
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
