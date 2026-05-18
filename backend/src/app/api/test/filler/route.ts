import { NextResponse } from "next/server";
import { detectFiller } from "@/services/filler";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const text = body?.text;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "请输入文本" }, { status: 400 });
  }

  const result = detectFiller(text);
  return NextResponse.json(result);
}
