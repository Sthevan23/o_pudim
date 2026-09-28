import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import { masterRouter, publicRouter } from "./routes/master.routes";
import { errorHandler, notFound } from "./middlewares/errorHandler";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: "2mb" }));
  app.use("/uploads", express.static(path.resolve(env.uploadDir)));

  app.use(
    "/api/auth/login",
    rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { message: "Muitas tentativas. Aguarde um pouco." } }),
  );
  app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 400 }));

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/master", masterRouter);
  app.use("/api/public", publicRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
