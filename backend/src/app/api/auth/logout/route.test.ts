import { describe, it, expect } from "@jest/globals";
import { POST } from "./route";

describe("POST /api/auth/logout", () => {
  it("should return success with clear-cookie header", async () => {
    const req = new Request("http://localhost:3001/api/auth/logout", {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    // Should set refreshToken cookie with maxAge=0
    const setCookie = res.headers.getSetCookie?.() ?? [];
    const refreshCookie = setCookie.find((c: string) => c.startsWith("refreshToken="));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain("Max-Age=0");
  });
});
