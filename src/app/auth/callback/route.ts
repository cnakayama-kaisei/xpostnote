import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user || !data.user.email) {
    console.error("[auth/callback] exchangeCodeForSession error:", error);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // 管理者判定: ADMIN_EMAILS 環境変数（カンマ区切り）で設定
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  const email = data.user.email;
  const isAdmin = adminEmails.includes(email);

  // 初回ログイン時はUserを作成、2回目以降はemail/displayNameを更新
  await prisma.user.upsert({
    where: { supabaseUserId: data.user.id },
    update: {
      email,
      displayName: data.user.user_metadata?.full_name ?? null,
    },
    create: {
      supabaseUserId: data.user.id,
      email,
      displayName: data.user.user_metadata?.full_name ?? null,
      role: isAdmin ? "admin" : "customer",
    },
  });

  return NextResponse.redirect(`${origin}${next}`);
}
