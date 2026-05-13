import { spawn } from "node:child_process";
import {
  assertProdWriteConfirmation,
  getProdDatabaseUrl,
} from "./prod-database.ts";

const prismaArgs = process.argv.slice(2);

if (prismaArgs.length === 0) {
  console.error("Usage: tsx prisma/run-prisma-prod.ts <prisma args>");
  process.exit(1);
}

assertProdWriteConfirmation("prisma-prod");

const child = spawn("npx", ["prisma", ...prismaArgs], {
  env: {
    ...process.env,
    DATABASE_URL: getProdDatabaseUrl(),
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
