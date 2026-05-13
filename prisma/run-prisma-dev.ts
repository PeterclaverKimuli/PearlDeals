import { spawn } from "node:child_process";
import { getDevDatabaseUrl } from "./dev-database.ts";

const prismaArgs = process.argv.slice(2);

if (prismaArgs.length === 0) {
  console.error("Usage: tsx prisma/run-prisma-dev.ts <prisma args>");
  process.exit(1);
}

const databaseUrlDev = getDevDatabaseUrl();

const child = spawn("npx", ["prisma", ...prismaArgs], {
  env: {
    ...process.env,
    DATABASE_URL: databaseUrlDev,
  },
  shell: true,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`Prisma exited from signal ${signal}.`);
    process.exit(1);
  }

  process.exit(code ?? 1);
});
