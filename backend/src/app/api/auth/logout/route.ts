import { NextResponse } from "next/server";
import { clearRefreshCookie } from "@/lib/auth";

export async function POST(_request: Request) {
  const response = NextResponse.json({ success: true });
  const { name, value, options } = clearRefreshCookie();
  response.cookies.set(name, value, options);
  return response;
}
