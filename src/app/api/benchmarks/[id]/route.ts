export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const appUser = await getAppUser();
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const benchmark = await prisma.benchmark.findUnique({ where: { id } });
  if (!benchmark || benchmark.userId !== appUser.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.benchmark.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
