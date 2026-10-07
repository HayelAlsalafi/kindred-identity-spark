import { rmSync } from "node:fs";

const userAgent = process.env.npm_config_user_agent ?? "";

if (!userAgent.startsWith("pnpm/")) {
  console.error("This project uses pnpm. Please run pnpm install.");
  process.exit(1);
}

for (const file of ["package-lock.json", "yarn.lock"]) {
  rmSync(file, {
    force: true,
  });
}

console.log("Package manager check passed: pnpm");
