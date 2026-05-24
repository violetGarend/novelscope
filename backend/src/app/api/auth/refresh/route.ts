import { NextResponse } from "next/server";
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  getRefreshCookieOptions,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/refreshToken=([^;]+)/);
    const refreshToken = match?.[1];

    if (!refreshToken) {
      return NextResponse.json({ error: "未提供刷新令牌" }, { status: 401 });
    }

    let payload: { userId: string };
    try {
      payload = await verifyRefreshToken(refreshToken);
    } catch {
      return NextResponse.json({ error: "刷新令牌无效或已过期" }, { status: 401 });
    }

    const accessToken = await signAccessToken(payload.userId);
    const newRefreshToken = await signRefreshToken(payload.userId);

    const response = NextResponse.json({ accessToken });
    const { name, value, options } = getRefreshCookieOptions(newRefreshToken);
    response.cookies.set(name, value, options);
    return response;
  } catch {
    return NextResponse.json(
      { error: "刷新失败，请稍后重试" },
      { status: 500 }
    );
  }
}
