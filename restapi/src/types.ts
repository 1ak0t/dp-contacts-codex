export type AuthUser = {
  id: string;
  login: string;
  isSystemAdmin?: boolean;
};

export type TokenPayload = {
  sub: string;
  login: string;
  isSystemAdmin?: boolean;
};

export type Employee = {
  id?: string;
  fio: string;
  op: string;
  orgUnit: string;
  jobTitle: string;
  phoneNumber: string;
  innerPhone: string;
  persEmail: string;
  jobType: string;
  email: string;
  isAdmin?: boolean;
  adminPasswordHash?: string;
};
