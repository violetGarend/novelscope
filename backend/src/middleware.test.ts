import { describe, it, expect } from "@jest/globals";
import { middleware, config } from "./middleware";
import { NextRequest } from "next/server";

function mockRequest(method: string, url: string): NextRequest {
  return new NextRequest(new Request(url, { method }));
}

describe("CORS middleware", () => {
  it("should return 204 with CORS headers for OPTIONS /api/*", () => {
    const req = mockRequest("OPTIONS", "http://localhost:3001/api/evaluate");
    const res = middleware(req);

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, OPTIONS");
    expect(res.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type");
  });

  it("should add CORS headers and call next for POST /api/*", () => {
    const req = mockRequest("POST", "http://localhost:3001/api/evaluate");
    const res = middleware(req);

    // The response from middleware is a NextResponse
    const origin = res.headers.get("Access-Control-Allow-Origin");
    // middleware.next() returns a response with the CORS headers set
    expect(origin).toBe("*");
  });

  it("should add CORS headers to non-API paths too (matcher limits at framework level)", () => {
    // The middleware function itself adds CORS to all requests.
    // Next.js applies the matcher config at the framework level.
    const req = mockRequest("GET", "http://localhost:3001/");
    const res = middleware(req);

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("should configure matcher to /api/:path*", () => {
    expect(config).toEqual({ matcher: "/api/:path*" });
  });
});
