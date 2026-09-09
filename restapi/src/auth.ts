import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "./config.js";
import { findAdminByEmail } from "./repositories/employeesRepository.js";
import type { AuthUser, TokenPayload } from "./types.js";

const user: AuthUser = {
  id: "system-admin",
  login: config.authLogin,
  isSystemAdmin: true,
};

const passwordHash = bcrypt.hashSync(config.authPassword, 10);

export async function validateCredentials(login: string, password: string): Promise<AuthUser | null> {
  const normalizedLogin = login.trim();

  if (normalizedLogin === user.login) {
    const isValidPassword = await bcrypt.compare(password, passwordHash);
    return isValidPassword ? user : null;
  }

  const employee = await findAdminByEmail(normalizedLogin);
  if (!employee?.adminPasswordHash) {
    return null;
  }

  const isValidPassword = await bcrypt.compare(password, employee.adminPasswordHash);
  return isValidPassword ? { id: employee._id.toString(), login: employee.email } : null;
}

export function createToken(authUser: AuthUser): string {
  const payload: TokenPayload = {
    sub: authUser.id,
    login: authUser.login,
    isSystemAdmin: authUser.isSystemAdmin,
  };
  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, config.jwtSecret, options);
}

export function verifyToken(token: string): AuthUser {
  const payload = jwt.verify(token, config.jwtSecret) as TokenPayload;

  return {
    id: payload.sub,
    login: payload.login,
    isSystemAdmin: payload.isSystemAdmin,
  };
}
