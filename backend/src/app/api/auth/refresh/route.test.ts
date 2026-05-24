import { describe, it, expect, beforeEach, afterAll } from "@jest/globals";
import { POST } from "./route";

const OLD_ENV = process.env;

beforeEach(() => {
  process.env = { ...OLD_ENV };
  process.env.JWT_SECRET = "a-32-character-secret-key-here";
});

afterAll(() => {
  process.env = OLD_ENV;
});

function createRequest(cookie?: string): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cookie) headers["cookie"] = cookie;
  return new Request("http://localhost:3001/api/auth/refresh", {
    method: "POST",
    headers,
  });
}

describe("POST /api/auth/refresh", () => {
  it("should issue a new access token with valid refresh token", async () => {
    const { signRefreshToken } = await import("@/lib/auth");
    const token = await signRefreshToken("user_abc123");

    const req = createRequest(`refreshToken=${token}`);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.accessToken).toBeDefined();
  });

  it("should return 401 when no refresh token cookie", async () => {
    const req = createRequest();
    const res = await POST(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("令牌");
  });

  it("should return 401 for expired refresh token", async () => {
    const { SignJWT } = await import("jose");
    const encoder = new TextEncoder();
    const expiredToken = await new SignJWT({ userId: "test" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("0s")
      .sign(encoder.encode(process.env.JWT_SECRET!));

    const req = createRequest(`refreshToken=${expiredToken}`);
    const res = await POST(req);

    expect(res.status).toBe(401);
  });
});
