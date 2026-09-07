import { Router } from "express";
import { createToken, validateCredentials } from "../auth.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

export const authRouter = Router();

authRouter.post("/login", async (request, response) => {
  const { login, password } = request.body as { login?: unknown; password?: unknown };

  if (typeof login !== "string" || typeof password !== "string") {
    return response.status(400).json({ message: "Login and password are required" });
  }

  const user = await validateCredentials(login, password);

  if (!user) {
    return response.status(401).json({ message: "Invalid login or password" });
  }

  return response.json({
    token: createToken(user),
    user,
  });
});

authRouter.get("/me", authMiddleware, (request, response) => {
  return response.json({ user: request.user });
});

authRouter.post("/logout", (_request, response) => {
  return response.status(204).send();
});
