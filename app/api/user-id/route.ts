import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // HTTP 헤더에서 UUID를 읽어옵니다
  const userId = request.headers.get("uuid") || null;

  return NextResponse.json({ userId });
}

