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
import { POST } from "./route";

function createRequest(body: unknown): Request {
  return new Request("http://localhost:3001/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  it("should login with valid credentials", async () => {
    // Use a real bcrypt hash for "password123"
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.default.hash("password123", 10);

    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "user_abc123",
      email: "test@example.com",
      name: null,
      passwordHash: hash,
      oauthProvider: null,
      oauthId: null,
      plan: "free",
      quotaUsed: 0,
      quotaLimit: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = createRequest({ email: "test@example.com", password: "password123" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.email).toBe("test@example.com");
    expect(data.accessToken).toBeDefined();
    expect(data.user.passwordHash).toBeUndefined();
  });

  it("should return 401 for wrong password", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.default.hash("password123", 10);

    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "user_abc123",
      email: "test@example.com",
      passwordHash: hash,
    });

    const req = createRequest({ email: "test@example.com", password: "wrongpassword" });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("邮箱或密码错误");
  });

  it("should return 401 for nonexistent user", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const req = createRequest({ email: "no@example.com", password: "password123" });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("邮箱或密码错误");
  });
});
