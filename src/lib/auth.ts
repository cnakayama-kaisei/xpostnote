import { redirect } from "next/navigation";
import { createServerSupabase } from "./supabase/server";
import { prisma } from "./prisma";

/**
 * Supabaseセッションを検証し、アプリDBのUserを返す。
 * 未ログインまたはUserが存在しない場合は null を返す。
 */
export async function getAppUser() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return prisma.user.findUnique({
    where: { supabaseUserId: user.id },
  });
}

/**
 * ログイン必須。未ログインなら /login にリダイレクト。
 */
export async function requireAppUser() {
  const user = await getAppUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * admin必須。未ログインなら /login、非adminなら / にリダイレクト。
 */
export async function requireAdmin() {
  const user = await requireAppUser();
  if (user.role !== "admin") redirect("/");
  return user;
}
