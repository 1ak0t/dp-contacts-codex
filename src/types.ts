export type Employee = Record<string, string | boolean | undefined> & {
  id?: string;
  fio: string;
  email: string;
  isAdmin?: boolean;
};

export type ColumnKey = "op" | "fio" | "jobTitle" | "phoneNumber" | "email";

export type SortConfig = {
  key: ColumnKey;
  direction: "asc" | "desc";
};

export type AuthUser = {
  id: string;
  login: string;
};

export type EmployeeForm = {
  fio: string;
  op: string;
  orgUnit: string;
  jobTitle: string;
  phoneNumber: string;
  innerPhone: string;
  persEmail: string;
  jobType: string;
  email: string;
};

