import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3333),
  databaseUrl: required("DATABASE_URL"),
  useEmbeddedPg: (process.env.USE_EMBEDDED_PG ?? "true") === "true",
  embeddedPgPort: Number(process.env.EMBEDDED_PG_PORT ?? 54329),
  embeddedPgDir: process.env.EMBEDDED_PG_DIR ?? "./data/pg",
  jwtSecret: required("JWT_SECRET", "dev-only-change-in-production"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  uploadDir: process.env.UPLOAD_DIR ?? "./uploads",
  isDev: (process.env.NODE_ENV ?? "development") !== "production",
};
