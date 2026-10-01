import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";

// Only the external boundaries are mocked: Clerk's session reader and the DB.
// The middleware logic under test is the real implementation.
const getAuthMock = vi.fn();
vi.mock("@clerk/express", () => ({ getAuth: (req: unknown) => getAuthMock(req) }));

type Row = Record<string, unknown>;
const dbState: { selectResult: Row[]; insertResult: Row[]; updateResult: Row[] } = {
  selectResult: [],
  insertResult: [],
  updateResult: [],
};
const chain = (result: () => Row[]) => {
  const c: Record<string, unknown> = {};
  for (const m of ["from", "where", "values", "set", "onConflictDoNothing"]) c[m] = () => c;
  c["limit"] = async () => result();
  c["returning"] = async () => result();
  return c;
};
vi.mock("@workspace/db", () => ({
  usersTable: { clerkUserId: "clerk_user_id", id: "id" },
  db: {
    select: () => chain(() => dbState.selectResult),
    insert: () => chain(() => dbState.insertResult),
    update: () => chain(() => dbState.updateResult),
  },
}));

const { requireAdmin, requireAuthenticatedUser, resolveLocalUser, toSafeUser, AuthError } =
  await import("./auth");

function makeUser(overrides: Row = {}) {
  const now = new Date("2026-01-01T00:00:00Z");
  return {
    id: "00000000-0000-0000-0000-000000000001",
    clerkUserId: "user_abc",
    email: "learner@example.com",
    displayName: "Learner",
    role: "USER",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
    ...overrides,
  };
}

function makeRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
  return res;
}

const req = () => ({ log: { error: vi.fn() } }) as unknown as Request;

beforeEach(() => {
  getAuthMock.mockReset();
  dbState.selectResult = [];
  dbState.insertResult = [];
  dbState.updateResult = [];
});

describe("authentication", () => {
  it("rejects requests without a Clerk session (401)", async () => {
    getAuthMock.mockReturnValue({ userId: null, sessionClaims: null });
    const res = makeRes();
    const next = vi.fn();
    await requireAuthenticatedUser(req(), res as unknown as Response, next as NextFunction);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: { code: "UNAUTHENTICATED", message: "Authentication is required." } });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a session whose token has no email claim (401)", async () => {
    getAuthMock.mockReturnValue({ userId: "user_abc", sessionClaims: {} });
    await expect(resolveLocalUser(req())).rejects.toBeInstanceOf(AuthError);
  });

  it("provisions a new local user with role USER on first sign-in", async () => {
    getAuthMock.mockReturnValue({ userId: "user_new", sessionClaims: { email: "new@example.com" } });
    const created = makeUser({ clerkUserId: "user_new", email: "new@example.com" });
    dbState.insertResult = [created];
    const user = await resolveLocalUser(req());
    expect(user.role).toBe("USER");
    expect(user.clerkUserId).toBe("user_new");
  });

  it("attaches the existing user and calls next for an active account", async () => {
    getAuthMock.mockReturnValue({ userId: "user_abc", sessionClaims: { email: "learner@example.com" } });
    const existing = makeUser();
    dbState.selectResult = [existing];
    dbState.updateResult = [existing];
    const request = req();
    const res = makeRes();
    const next = vi.fn();
    await requireAuthenticatedUser(request, res as unknown as Response, next as NextFunction);
    expect(next).toHaveBeenCalledOnce();
    expect(request.dbUser?.id).toBe(existing.id);
  });

  it("blocks disabled accounts (403 ACCOUNT_DISABLED)", async () => {
    getAuthMock.mockReturnValue({ userId: "user_abc", sessionClaims: { email: "learner@example.com" } });
    const disabled = makeUser({ status: "DISABLED" });
    dbState.selectResult = [disabled];
    dbState.updateResult = [disabled];
    const res = makeRes();
    const next = vi.fn();
    await requireAuthenticatedUser(req(), res as unknown as Response, next as NextFunction);
    expect(res.statusCode).toBe(403);
    expect((res.body as { error: { code: string } }).error.code).toBe("ACCOUNT_DISABLED");
    expect(next).not.toHaveBeenCalled();
  });

  it("returns a generic 500 without leaking internal errors", async () => {
    getAuthMock.mockImplementation(() => {
      throw new Error("db password leaked in stack");
    });
    const res = makeRes();
    await requireAuthenticatedUser(req(), res as unknown as Response, vi.fn() as NextFunction);
    expect(res.statusCode).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain("password");
  });

  it("toSafeUser does not expose the Clerk user ID", () => {
    expect(toSafeUser(makeUser() as never)).not.toHaveProperty("clerkUserId");
  });
});

describe("authorization", () => {
  it("rejects requireAdmin when no user was resolved (401)", () => {
    const res = makeRes();
    const next = vi.fn();
    requireAdmin(req(), res as unknown as Response, next as NextFunction);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects USER role from admin routes (403 FORBIDDEN)", () => {
    const request = req();
    request.dbUser = makeUser() as never;
    const res = makeRes();
    const next = vi.fn();
    requireAdmin(request, res as unknown as Response, next as NextFunction);
    expect(res.statusCode).toBe(403);
    expect((res.body as { error: { code: string } }).error.code).toBe("FORBIDDEN");
    expect(next).not.toHaveBeenCalled();
  });

  it("allows ADMIN role", () => {
    const request = req();
    request.dbUser = makeUser({ role: "ADMIN" }) as never;
    const next = vi.fn();
    requireAdmin(request, makeRes() as unknown as Response, next as NextFunction);
    expect(next).toHaveBeenCalledOnce();
  });

  it("does not trust client-supplied role claims — role comes from the DB row", async () => {
    getAuthMock.mockReturnValue({
      userId: "user_abc",
      sessionClaims: { email: "learner@example.com", role: "ADMIN" },
    });
    const existing = makeUser({ role: "USER" });
    dbState.selectResult = [existing];
    dbState.updateResult = [existing];
    const request = req();
    await requireAuthenticatedUser(request, makeRes() as unknown as Response, vi.fn() as NextFunction);
    const res = makeRes();
    const next = vi.fn();
    requireAdmin(request, res as unknown as Response, next as NextFunction);
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });
});
