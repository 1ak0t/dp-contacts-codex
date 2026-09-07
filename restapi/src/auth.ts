import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "./config.js";
import type { AuthUser, TokenPayload } from "./types.js";

const user: AuthUser = {
  id: "default-user",
  login: config.authLogin,
};

const passwordHash = bcrypt.hashSync(config.authPassword, 10);

export async function validateCredentials(login: string, password: string): Promise<AuthUser | null> {
  if (login !== user.login) {
    return null;
  }

  const isValidPassword = await bcrypt.compare(password, passwordHash);
  return isValidPassword ? user : null;
}

export function createToken(authUser: AuthUser): string {
  const payload: TokenPayload = {
    sub: authUser.id,
    login: authUser.login,
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
  };
}
