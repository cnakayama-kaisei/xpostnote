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
