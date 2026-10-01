import { describe, expect, it } from "vitest";
import { assertEnv, checkEnv } from "./env";

const valid = {
  PORT: "3000",
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  CLERK_PUBLISHABLE_KEY: "pk_test_placeholder",
  CLERK_SECRET_KEY: "sk_test_placeholder",
};

describe("environment validation", () => {
  it("accepts a complete configuration", () => {
    expect(checkEnv(valid)).toEqual({ missing: [], invalid: [] });
  });

  it("reports every missing variable by name", () => {
    expect(checkEnv({}).missing).toEqual(["PORT", "DATABASE_URL", "CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"]);
  });

  it("rejects a secret key placed in the publishable slot", () => {
    expect(checkEnv({ ...valid, CLERK_PUBLISHABLE_KEY: "sk_test_x" }).invalid[0]).toMatch(/CLERK_PUBLISHABLE_KEY/);
  });

  it("never includes secret values in the error message", () => {
    const secret = "not_a_real_key_value_12345";
    try {
      assertEnv({ ...valid, CLERK_SECRET_KEY: secret });
      throw new Error("expected failure");
    } catch (e) {
      expect((e as Error).message).not.toContain(secret);
      expect((e as Error).message).toContain("CLERK_SECRET_KEY");
    }
  });
});
