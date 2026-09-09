import "dotenv/config";

const defaultCorsOrigins = ["http://10.13.2.73", "http://127.0.0.1:5173", "http://localhost:5173"];

function readCorsOrigins(): string[] {
  const value = process.env.CORS_ORIGIN;

  if (!value) {
    return defaultCorsOrigins;
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const config = {
  host: process.env.HOST ?? "0.0.0.0",
  port: Number(process.env.PORT ?? 4000),
  corsOrigins: readCorsOrigins(),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  authLogin: process.env.AUTH_LOGIN ?? "admin",
  authPassword: process.env.AUTH_PASSWORD ?? "DP-admin-7mK4-rQ92",
  mongoUri: process.env.MONGO_URI ?? "mongodb://localhost:27017/",
  mongoDbName: process.env.MONGO_DB_NAME ?? "contacts",
};
