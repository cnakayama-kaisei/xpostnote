export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const appUser = await getAppUser();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const displayName =
    typeof body.displayName === "string"
      ? body.displayName.trim() || null
      : null;

  const updated = await prisma.user.update({
    where: { id: appUser.id },
    data: { displayName },
    select: { id: true, email: true, displayName: true, role: true },
  });

  return NextResponse.json(updated);
}
