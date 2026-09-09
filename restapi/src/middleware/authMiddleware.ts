import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../auth.js";
import { isEmployeeAdmin } from "../repositories/employeesRepository.js";
import type { AuthUser } from "../types.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authMiddleware(request: Request, response: Response, next: NextFunction) {
  const header = request.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return response.status(401).json({ message: "Authorization token is required" });
  }

  try {
    const user = verifyToken(token);

    if (!user.isSystemAdmin && !(await isEmployeeAdmin(user.id))) {
      return response.status(401).json({ message: "Authorization token is invalid or expired" });
    }

    request.user = user;
    return next();
  } catch {
    return response.status(401).json({ message: "Authorization token is invalid or expired" });
  }
}
