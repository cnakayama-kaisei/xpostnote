"use client";

import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

interface AppUser {
  email: string;
  displayName: string | null;
  role: string;
}

export default function NavBarClient({ appUser }: { appUser: AppUser | null }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">
        <span className="font-bold text-lg">X Post Suggest</span>

        {appUser && (
          <>
            <Link href="/benchmarks" className="text-gray-600 hover:text-black">
              ベンチマーク
            </Link>
            <Link href="/generate" className="text-gray-600 hover:text-black">
              ポスト生成
            </Link>
            <Link href="/history" className="text-gray-600 hover:text-black">
              履歴
            </Link>
            {appUser.role === "admin" && (
              <Link href="/admin/users" className="text-gray-600 hover:text-black">
                ユーザー管理
              </Link>
            )}
            <Link href="/profile" className="text-gray-600 hover:text-black">
              プロフィール
            </Link>
          </>
        )}

        <span className="ml-auto flex items-center gap-4">
          {appUser ? (
            <>
              <span className="text-sm text-gray-500">
                {appUser.displayName || appUser.email}
                {appUser.role === "admin" && (
                  <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1 rounded">
                    admin
                  </span>
                )}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-black"
              >
                ログアウト
              </button>
            </>
          ) : null}
        </span>
      </nav>
    </header>
  );
}
