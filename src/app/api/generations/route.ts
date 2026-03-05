export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth";

export async function GET() {
  const appUser = await getAppUser();
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const generations = await prisma.generation.findMany({
    where: { userId: appUser.id },
    orderBy: { createdAt: "desc" },
    include: { drafts: true },
  });
  return NextResponse.json(generations);
}
