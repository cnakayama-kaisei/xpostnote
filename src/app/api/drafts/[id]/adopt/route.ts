export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const appUser = await getAppUser();
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const draft = await prisma.draft.findUnique({
    where: { id },
    include: { generation: true },
  });

  // Draft の所有確認は親 Generation の userId で行う
  if (!draft || draft.generation.userId !== appUser.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.draft.update({
    where: { id },
    data: { adopted: !draft.adopted },
  });

  return NextResponse.json(updated);
}
