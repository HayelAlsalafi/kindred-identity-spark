/**
 * Phase 3B-1: HTTP-level tests for /api/admin/topics.
 * The REAL requireAuthenticatedUser/requireAdmin run; only Clerk's session
 * reader, the DB user lookup, and the topic service are mocked.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import type { AddressInfo } from "node:net";

const getAuthMock = vi.fn();
vi.mock("@clerk/express", () => ({ getAuth: (req: unknown) => getAuthMock(req) }));

let currentUser: Record<string, unknown> | null = null;
const chain = () => {
  const c: Record<string, unknown> = {};
  for (const m of ["from", "where", "values", "set", "onConflictDoNothing"]) c[m] = () => c;
  c["limit"] = async () => (currentUser ? [currentUser] : []);
  c["returning"] = async () => (currentUser ? [currentUser] : []);
  return c;
};
vi.mock("@workspace/db", () => ({
  usersTable: { clerkUserId: "clerk_user_id", id: "id" },
  topicsTable: {},
  db: { select: chain, insert: chain, update: chain },
}));

const svc = {
  listAllTopics: vi.fn(),
  createTopic: vi.fn(),
  updateTopic: vi.fn(),
  disableTopic: vi.fn(),
};
vi.mock("../lib/topics-admin", async () => {
  class TopicError extends Error {
    constructor(public status: number, public code: string, message: string, public details?: unknown) {
      super(message);
    }
  }
  const now = new Date("2026-01-01T00:00:00Z");
  return {
    ...svc,
    TopicError,
    toAdminTopic: (t: Record<string, unknown>) => ({ ...t, createdAt: now.toISOString(), updatedAt: now.toISOString() }),
  };
});

const { default: router } = await import("./admin-topics");
const { TopicError } = (await import("../lib/topics-admin")) as unknown as {
  TopicError: new (s: number, c: string, m: string) => Error;
};

let base = "";
let server: ReturnType<ReturnType<typeof express>["listen"]>;
beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as unknown as { log: unknown }).log = { error: () => {}, info: () => {} };
    next();
  });
  app.use("/api", router);
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});
afterAll(() => server.close());

function signIn(role: "USER" | "ADMIN" | null, status = "ACTIVE") {
  if (!role) {
    getAuthMock.mockReturnValue({ userId: null, sessionClaims: {} });
    currentUser = null;
    return;
  }
  getAuthMock.mockReturnValue({ userId: "user_x", sessionClaims: { email: "a@example.com" } });
  const now = new Date();
  currentUser = {
    id: "00000000-0000-0000-0000-000000000001", clerkUserId: "user_x", email: "a@example.com",
    displayName: "a", role, status, createdAt: now, updatedAt: now, lastLoginAt: now,
  };
}
const topic = { id: "11111111-1111-4111-8111-111111111111", slug: "routing", name: "Routing", description: "", displayOrder: 1, status: "ACTIVE" };
const req = (method: string, path: string, body?: unknown) =>
  fetch(base + path, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });

beforeEach(() => Object.values(svc).forEach((f) => f.mockReset()));

describe("admin topic API authorization", () => {
  const routes: [string, string, unknown?][] = [
    ["GET", "/admin/topics"],
    ["POST", "/admin/topics", { slug: "x", name: "X" }],
    ["PATCH", `/admin/topics/${topic.id}`, { name: "Y" }],
    ["POST", `/admin/topics/${topic.id}/disable`],
  ];
  it.each(routes)("%s %s → 401 without a session", async (m, p, b) => {
    signIn(null);
    const r = await req(m, p, b);
    expect(r.status).toBe(401);
    expect((await r.json()).error.code).toBe("UNAUTHENTICATED");
  });
  it.each(routes)("%s %s → 403 FORBIDDEN for USER", async (m, p, b) => {
    signIn("USER");
    const r = await req(m, p, b);
    expect(r.status).toBe(403);
    expect((await r.json()).error.code).toBe("FORBIDDEN");
  });
  it("403 ACCOUNT_DISABLED for a disabled ADMIN", async () => {
    signIn("ADMIN", "DISABLED");
    const r = await req("GET", "/admin/topics");
    expect(r.status).toBe(403);
    expect((await r.json()).error.code).toBe("ACCOUNT_DISABLED");
  });
  it("service is never reached for non-admins", () => {
    expect(svc.listAllTopics).not.toHaveBeenCalled();
    expect(svc.createTopic).not.toHaveBeenCalled();
  });
});

describe("admin topic API (ADMIN)", () => {
  beforeEach(() => signIn("ADMIN"));
  it("lists all topics including disabled", async () => {
    svc.listAllTopics.mockResolvedValue([topic, { ...topic, id: "2", status: "DISABLED" }]);
    const r = await req("GET", "/admin/topics");
    expect(r.status).toBe(200);
    expect((await r.json()).map((t: { status: string }) => t.status)).toEqual(["ACTIVE", "DISABLED"]);
  });
  it("creates → 201", async () => {
    svc.createTopic.mockResolvedValue(topic);
    const r = await req("POST", "/admin/topics", { slug: "routing", name: "Routing" });
    expect(r.status).toBe(201);
    expect(svc.createTopic).toHaveBeenCalledWith({ slug: "routing", name: "Routing" });
  });
  it("maps validation/conflict/not-found errors", async () => {
    svc.createTopic.mockRejectedValueOnce(new TopicError(400, "VALIDATION_ERROR", "bad"));
    expect((await req("POST", "/admin/topics", {})).status).toBe(400);
    svc.createTopic.mockRejectedValueOnce(new TopicError(409, "CONFLICT", "dup"));
    expect((await req("POST", "/admin/topics", { slug: "a", name: "A" })).status).toBe(409);
    svc.updateTopic.mockRejectedValueOnce(new TopicError(404, "NOT_FOUND", "nf"));
    expect((await req("PATCH", `/admin/topics/${topic.id}`, { name: "Z" })).status).toBe(404);
  });
  it("updates and disables", async () => {
    svc.updateTopic.mockResolvedValue({ ...topic, name: "New" });
    expect((await (await req("PATCH", `/admin/topics/${topic.id}`, { name: "New" })).json()).name).toBe("New");
    svc.disableTopic.mockResolvedValue({ ...topic, status: "DISABLED" });
    const r = await req("POST", `/admin/topics/${topic.id}/disable`);
    expect((await r.json()).status).toBe("DISABLED");
  });
  it("non-uuid id → 404 without calling the service", async () => {
    const r = await req("POST", "/admin/topics/not-a-uuid/disable");
    expect(r.status).toBe(404);
    expect(svc.disableTopic).not.toHaveBeenCalled();
  });
  it("internal errors do not leak details", async () => {
    svc.listAllTopics.mockRejectedValue(new Error("connection string secret"));
    const r = await req("GET", "/admin/topics");
    expect(r.status).toBe(500);
    expect(await r.text()).not.toContain("secret");
  });
});
