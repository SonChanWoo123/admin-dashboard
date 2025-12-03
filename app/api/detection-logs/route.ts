import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 환경 변수 검증
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error("[API] NEXT_PUBLIC_SUPABASE_URL 환경 변수가 설정되지 않았습니다.");
}

// 서버 사이드에서는 SERVICE_ROLE_KEY를 사용하는 것이 좋습니다 (RLS 우회)
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

if (!supabaseKey) {
  console.error("[API] Supabase 키가 설정되지 않았습니다. SUPABASE_SERVICE_ROLE_KEY 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.");
}

if (!supabaseUrl || !supabaseKey) {
  // 초기화 시점에 에러를 던지지 않고, 요청 시 에러를 반환하도록 함
}

const supabaseAdmin = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function GET(request: NextRequest) {
  // 환경 변수 검증
  if (!supabaseUrl || !supabaseKey || !supabaseAdmin) {
    console.error("[API] Supabase 클라이언트 초기화 실패");
    return NextResponse.json(
      { 
        error: "Supabase 설정 오류",
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
          usingServiceRoleKey: !!supabaseServiceRoleKey
        },
        hint: "환경 변수 NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY(또는 NEXT_PUBLIC_SUPABASE_ANON_KEY)를 확인하세요."
      },
      { status: 500 }
    );
  }

  // 1. 헤더에서 UUID 읽기 (대소문자 무시)
  let userId = request.headers.get("uuid") || 
               request.headers.get("UUID") ||
               request.headers.get("Uuid");
  
  // URL 쿼리 파라미터로도 시도
  if (!userId) {
    const { searchParams } = new URL(request.url);
    userId = searchParams.get("uuid") || searchParams.get("userId");
  }

  if (!userId) {
    const allHeaders = Object.fromEntries(request.headers.entries());
    console.error("[API] UUID 헤더 없음. 받은 헤더:", allHeaders);
    return NextResponse.json(
      { 
        error: "UUID header is missing", 
        receivedHeaders: allHeaders,
        hint: "요청 헤더에 'uuid' 또는 'UUID'를 포함하세요."
      },
      { status: 400 }
    );
  }

  console.log(`[API] Fetching logs for user: ${userId} (type: ${typeof userId})`);

  try {
    // 2. 서버 사이드에서 DB 직접 조회
    // UUID 타입이 문자열이든 UUID 타입이든 비교가 되도록 함
    const { data, error, count } = await supabaseAdmin
      .from("detection_logs")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[API] Supabase error:", JSON.stringify(error, null, 2));
      console.error("[API] Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      return NextResponse.json(
        { 
          error: error.message || "데이터베이스 조회 실패",
          details: error,
          userId: userId,
          hint: supabaseServiceRoleKey 
            ? "RLS 정책이나 테이블 권한을 확인하세요." 
            : "RLS 정책 문제일 수 있습니다. SUPABASE_SERVICE_ROLE_KEY를 사용하거나 RLS 정책을 확인하세요."
        },
        { status: 500 }
      );
    }

    console.log(`[API] 조회 성공: ${data?.length || 0}개 로그 발견 (총 ${count || 0}개)`);

    // 3. 디버깅 정보 포함하여 결과 반환
    return NextResponse.json({
      success: true,
      userId: userId,
      count: data?.length || 0,
      totalCount: count || 0,
      logs: data || [],
      debug: {
        userIdType: typeof userId,
        userIdLength: userId.length,
        firstLogUserId: data?.[0]?.user_id || null,
        firstLogUserIdType: typeof data?.[0]?.user_id || null,
        usingServiceRoleKey: !!supabaseServiceRoleKey,
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      }
    });
  } catch (err) {
    console.error("[API] 예상치 못한 에러:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "알 수 없는 에러 발생",
        details: err instanceof Error ? err.stack : String(err)
      },
      { status: 500 }
    );
  }
}

