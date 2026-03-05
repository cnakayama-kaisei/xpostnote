import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // セッションCookieを更新しながらレスポンスを生成
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() でトークンを検証（getSession() は使わない）
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // /login: ログイン済みはトップへ
  if (pathname === "/login") {
    if (user) return NextResponse.redirect(new URL("/", request.url));
    return supabaseResponse;
  }

  // 未ログインは /login へリダイレクト
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // /admin/* の権限チェックは各ページのサーバーコンポーネントで実施
  return supabaseResponse;
}

export const config = {
  matcher: [
    // 静的ファイル・auth/callback・APIルートはスキップ
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|api/).*)",
  ],
};
