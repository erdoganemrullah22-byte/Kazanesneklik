import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  aiLive: true,
  session: null as null | { user: { email: string } },
  allowed: false,
}));

vi.mock("@/lib/env", () => ({
  env: {
    get AI_LIVE() {
      return state.aiLive;
    },
    BETTER_AUTH_URL: "https://kazan.example",
  },
}));
vi.mock("@/server/session", () => ({
  getSession: vi.fn(async () => state.session),
  getAllowedSession: vi.fn(async () => (state.allowed ? state.session : null)),
}));
const runSmokeForServer = vi.fn(async () => ({
  ok: true,
  model: "claude-opus-5-5",
  stop_reason: "end_turn",
  latencyMs: 812,
}));
vi.mock("@/server/ai", () => ({ runSmokeForServer }));

const route = await import("./route");
const { POST } = route;

function request(origin: string | null = "https://kazan.example") {
  return new Request("https://kazan.example/api/admin/ai/smoke", {
    method: "POST",
    headers: origin ? { origin } : {},
  });
}

describe("POST /api/admin/ai/smoke", () => {
  beforeEach(() => {
    state.aiLive = true;
    state.session = { user: { email: "sahip@example.com" } };
    state.allowed = true;
    runSmokeForServer.mockClear();
  });

  it("does not exist while AI_LIVE is off", async () => {
    state.aiLive = false;
    expect((await POST(request())).status).toBe(404);
    expect(runSmokeForServer).not.toHaveBeenCalled();
  });

  it("is 404 for cross-origin or origin-less requests", async () => {
    expect((await POST(request("https://evil.example"))).status).toBe(404);
    expect((await POST(request(null))).status).toBe(404);
    expect(runSmokeForServer).not.toHaveBeenCalled();
  });

  it("is 404 without a session", async () => {
    state.session = null;
    expect((await POST(request())).status).toBe(404);
  });

  it("is 403 for a session whose e-mail is not allowlisted", async () => {
    state.allowed = false;
    expect((await POST(request())).status).toBe(403);
    expect(runSmokeForServer).not.toHaveBeenCalled();
  });

  it("returns only ok, model, stop_reason and latencyMs", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      ok: true,
      model: "claude-opus-5-5",
      stop_reason: "end_turn",
      latencyMs: 812,
    });
  });
});

describe("other methods on /api/admin/ai/smoke", () => {
  it.each(["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "DELETE"] as const)(
    "%s answers 404 (not 405), whether AI_LIVE is on or off",
    async (method) => {
      for (const aiLive of [false, true]) {
        state.aiLive = aiLive;
        const response = route[method]();
        expect(response.status).toBe(404);
        expect(response.headers.get("allow")).toBeNull();
      }
      expect(runSmokeForServer).not.toHaveBeenCalled();
    },
  );
});
