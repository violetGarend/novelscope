import { describe, it, expect, beforeEach, afterAll } from "@jest/globals";

const OLD_ENV = process.env;

beforeEach(() => {
  process.env = { ...OLD_ENV };
  process.env.JWT_SECRET = "a-32-character-secret-key-here";
  process.env.DATABASE_URL = "postgresql://localhost/test";
});

afterAll(() => {
  process.env = OLD_ENV;
});

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { GET } from "./route";

function createRequest(token?: string): Request {
  const headers: Record<string, string> = {};
  if (token) headers["authorization"] = `Bearer ${token}`;
  return new Request("http://localhost:3001/api/auth/me", {
    method: "GET",
    headers,
  });
}

describe("GET /api/auth/me", () => {
  it("should return user info for valid access token", async () => {
    const { signAccessToken } = await import("@/lib/auth");
    const token = await signAccessToken("user_abc123");

    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "user_abc123",
      email: "test@example.com",
      name: "Test User",
      plan: "free",
      quotaUsed: 0,
      quotaLimit: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = createRequest(token);
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.email).toBe("test@example.com");
    expect(data.user.name).toBe("Test User");
  });

  it("should return 401 when no token provided", async () => {
    const req = createRequest();
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("should return 401 for expired token", async () => {
    const { SignJWT } = await import("jose");
    const encoder = new TextEncoder();
    const expiredToken = await new SignJWT({ userId: "test" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("0s")
      .sign(encoder.encode(process.env.JWT_SECRET!));

    const req = createRequest(expiredToken);
    const res = await GET(req);

    expect(res.status).toBe(401);
  });
});
