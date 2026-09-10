import "dotenv/config";

const defaultCorsOrigins = ["https://contacts.detail-project.ru:5412", "http://127.0.0.1:5412", "http://localhost:5412"];

function readBoolean(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes((value ?? "").trim().toLowerCase());
}

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
  https: readBoolean(process.env.HTTPS),
  sslKeyPath: process.env.SSL_KEY_PATH ?? "../ssl/csr_key.txt",
  sslCertPath: process.env.SSL_CERT_PATH ?? "../ssl/detail-project.ru.fullchain.crt",
  sslPassphrase: process.env.SSL_PASSPHRASE || undefined,
  corsOrigins: readCorsOrigins(),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  authLogin: process.env.AUTH_LOGIN ?? "admin",
  authPassword: process.env.AUTH_PASSWORD ?? "DP-admin-7mK4-rQ92",
  mongoUri: process.env.MONGO_URI ?? "mongodb://localhost:27017/",
  mongoDbName: process.env.MONGO_DB_NAME ?? "contacts",
};
