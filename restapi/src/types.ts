export type AuthUser = {
  id: string;
  login: string;
};

export type TokenPayload = {
  sub: string;
  login: string;
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
};
