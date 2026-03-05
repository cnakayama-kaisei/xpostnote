import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import NavBarClient from "./NavBarClient";

export default async function NavBar() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <NavBarClient appUser={null} />;
  }

  const appUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    select: { email: true, displayName: true, role: true },
  });

  return <NavBarClient appUser={appUser} />;
}
