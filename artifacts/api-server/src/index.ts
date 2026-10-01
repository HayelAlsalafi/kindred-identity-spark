import { assertEnv } from "./lib/env";

// Validate configuration before loading modules that read it (db, Clerk).
assertEnv();

const { default: app } = await import("./app");
const { logger } = await import("./lib/logger");

const port = Number(process.env["PORT"]);

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
