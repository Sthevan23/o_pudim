import { execSync } from "child_process";

execSync("npx prisma generate", { stdio: "inherit" });
execSync("npx prisma db push", { stdio: "inherit" });
execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
