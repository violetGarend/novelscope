import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const match = authHeader.match(/^Bearer (.+)$/);
    const token = match?.[1];

    if (!token) {
      return NextResponse.json({ error: "未提供认证令牌" }, { status: 401 });
    }

    let payload: { userId: string };
    try {
      payload = await verifyAccessToken(token);
    } catch {
      return NextResponse.json({ error: "认证令牌无效或已过期" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        quotaUsed: user.quotaUsed,
        quotaLimit: user.quotaLimit,
        createdAt: user.createdAt,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "获取用户信息失败" },
      { status: 500 }
    );
  }
}
