import { describe, it, expect, beforeEach, afterAll } from "@jest/globals";
import { SignJWT } from "jose";
import {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
  getRefreshCookieOptions,
  clearRefreshCookie,
} from "./auth";

const OLD_ENV = process.env;

beforeEach(() => {
  process.env = { ...OLD_ENV };
  process.env.JWT_SECRET = "a-32-character-secret-key-here";
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe("signAccessToken + verifyAccessToken", () => {
  it("should sign and verify an access token successfully", async () => {
    const token = await signAccessToken("user_abc123");
    const payload = await verifyAccessToken(token);
    expect(payload.userId).toBe("user_abc123");
  });

  it("should reject an expired access token", async () => {
    const encoder = new TextEncoder();
    const expiredToken = await new SignJWT({ userId: "test" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("0s")
      .sign(encoder.encode(process.env.JWT_SECRET!));

    await expect(verifyAccessToken(expiredToken)).rejects.toThrow();
  });

  it("should reject a tampered access token", async () => {
    const token = await signAccessToken("user_abc123");
    const tampered = token.slice(0, -5) + "xxxxx";
    await expect(verifyAccessToken(tampered)).rejects.toThrow();
  });
});

describe("hashPassword + comparePassword", () => {
  it("should hash and verify a password", async () => {
    const hash = await hashPassword("my-secret-password");
    const match = await comparePassword("my-secret-password", hash);
    expect(match).toBe(true);
  });

  it("should reject a wrong password", async () => {
    const hash = await hashPassword("my-secret-password");
    const match = await comparePassword("wrong-password", hash);
    expect(match).toBe(false);
  });
});

describe("signRefreshToken + verifyRefreshToken", () => {
  it("should sign and verify a refresh token", async () => {
    const token = await signRefreshToken("user_abc123");
    const payload = await verifyRefreshToken(token);
    expect(payload.userId).toBe("user_abc123");
  });

  it("should reject an expired refresh token", async () => {
    const encoder = new TextEncoder();
    const expiredToken = await new SignJWT({ userId: "test" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("0s")
      .sign(encoder.encode(process.env.JWT_SECRET!));

    await expect(verifyRefreshToken(expiredToken)).rejects.toThrow();
  });
});

describe("getRefreshCookieOptions + clearRefreshCookie", () => {
  it("should return cookie options with httpOnly and 7d maxAge", () => {
    const { name, value, options } = getRefreshCookieOptions("some-refresh-token");
    expect(name).toBe("refreshToken");
    expect(value).toBe("some-refresh-token");
    expect(options.httpOnly).toBe(true);
    expect(options.maxAge).toBe(7 * 24 * 60 * 60);
  });

  it("should clear the refresh token cookie", () => {
    const { name, value, options } = clearRefreshCookie();
    expect(name).toBe("refreshToken");
    expect(value).toBe("");
    expect(options.maxAge).toBe(0);
  });
});
