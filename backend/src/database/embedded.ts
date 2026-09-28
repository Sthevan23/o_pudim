import fs from "fs";
import path from "path";
import EmbeddedPostgres from "embedded-postgres";
import { env } from "../config/env";

let instance: EmbeddedPostgres | null = null;
let started = false;

export async function startEmbeddedPostgres(): Promise<void> {
  if (!env.useEmbeddedPg || started) return;

  const databaseDir = path.resolve(process.cwd(), env.embeddedPgDir);
  fs.mkdirSync(databaseDir, { recursive: true });

  instance = new EmbeddedPostgres({
    databaseDir,
    user: "postgres",
    password: "postgres",
    port: env.embeddedPgPort,
    persistent: true,
    initdbFlags: ["--encoding=UTF8"],
  });

  const needsInit = !fs.existsSync(path.join(databaseDir, "PG_VERSION"));
  if (needsInit) {
    await instance.initialise();
  }

  try {
    await instance.start();
  } catch (error) {
    console.warn("Não foi possível iniciar o Postgres embutido (talvez a porta já esteja em uso).", error);
  }
  started = true;

  try {
    await instance.createDatabase("o_pudim");
  } catch {
    // banco já existe
  }

  console.log(`PostgreSQL embutido em 127.0.0.1:${env.embeddedPgPort}`);
}

export async function stopEmbeddedPostgres(): Promise<void> {
  if (instance && started) {
    await instance.stop();
    started = false;
  }
}
