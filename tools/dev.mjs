import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";
const pnpm = isWindows ? "pnpm.cmd" : "pnpm";

const processes = [];

function start(name, args, extraEnv = {}) {
  const child = spawn(pnpm, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      ...extraEnv,
    },
    // Windows needs the shell to launch pnpm.cmd correctly.
    // Linux/Replit can execute pnpm directly.
    shell: isWindows,
  });

  processes.push(child);

  child.on("error", (error) => {
    console.error(`[${name}] Failed to start:`, error);
    shutdown(1);
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      return;
    }

    if (code !== 0 && code !== null) {
      console.error(`[${name}] exited with code ${code}`);
      shutdown(code);
    }
  });

  return child;
}

function shutdown(exitCode = 0) {
  for (const child of processes) {
    if (!child.killed) {
      child.kill();
    }
  }

  process.exit(exitCode);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

start("api", ["--filter", "@workspace/api-server", "run", "dev"]);

start("web", ["--filter", "@workspace/ccna-learning", "run", "dev"], {
  PORT: "8080",
  BASE_PATH: "/",
});
