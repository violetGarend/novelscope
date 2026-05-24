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
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { POST } from "./route";

function createRequest(body: unknown): Request {
  return new Request("http://localhost:3001/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register", () => {
  it("should register a new user and return access token", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
    (prisma.user.create as jest.Mock).mockResolvedValueOnce({
      id: "user_abc123",
      email: "test@example.com",
      name: null,
      passwordHash: "$2a$10$hashedpassword",
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

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.user.email).toBe("test@example.com");
    expect(data.accessToken).toBeDefined();
    expect(data.user.passwordHash).toBeUndefined();
  });

  it("should return 409 for duplicate email", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: "existing_user" });

    const req = createRequest({ email: "test@example.com", password: "password123" });
    const res = await POST(req);

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain("已注册");
  });

  it("should return 400 for weak password (< 8 chars)", async () => {
    const req = createRequest({ email: "test@example.com", password: "1234567" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("密码");
  });
});
