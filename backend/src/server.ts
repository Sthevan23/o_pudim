import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { createApp } from "./app";
import { startEmbeddedPostgres, stopEmbeddedPostgres } from "./database/embedded";

async function bootstrap() {
  if (env.useEmbeddedPg) {
    await startEmbeddedPostgres();
  }

  await prisma.$connect();
  const app = createApp();

  const server = app.listen(env.port, () => {
    console.log(`API pronta em http://localhost:${env.port}`);
  });

  const shutdown = async () => {
    server.close();
    await prisma.$disconnect();
    await stopEmbeddedPostgres();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch(async (error) => {
  console.error("Falha ao iniciar o servidor:", error);
  await stopEmbeddedPostgres();
  process.exit(1);
});
