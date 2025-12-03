import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// 서버 사이드에서는 SERVICE_ROLE_KEY를 사용하는 것이 좋습니다 (RLS 우회)
// 테스트용으로 ANON_KEY도 시도해보고, 안 되면 SERVICE_ROLE_KEY로 변경하세요
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  // 1. 헤더에서 UUID 읽기
  const userId = request.headers.get("uuid");

  if (!userId) {
    return NextResponse.json(
      { error: "UUID header is missing", receivedHeaders: Object.fromEntries(request.headers.entries()) },
      { status: 400 }
    );
  }

  console.log(`[API] Fetching logs for user: ${userId}`);

  // 2. 서버 사이드에서 DB 직접 조회
  const { data, error } = await supabaseAdmin
    .from("detection_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[API] Supabase error:", error);
    return NextResponse.json(
      { 
        error: error.message, 
        details: error,
        hint: "RLS 정책 문제일 수 있습니다. SERVICE_ROLE_KEY를 사용하거나 RLS 정책을 확인하세요."
      },
      { status: 500 }
    );
  }

  // 3. 디버깅 정보 포함하여 결과 반환
  return NextResponse.json({
    success: true,
    userId: userId,
    count: data?.length || 0,
    logs: data || [],
    debug: {
      userIdType: typeof userId,
      firstLogUserId: data?.[0]?.user_id || null,
      firstLogUserIdType: typeof data?.[0]?.user_id || null,
      usingServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
}

