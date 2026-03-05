export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // admin判定（API側でも必須チェック）
  const currentUser = await getAppUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (currentUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { role } = body;
  if (role !== "admin" && role !== "customer") {
    return NextResponse.json(
      { error: "role は admin または customer のみ指定できます" },
      { status: 400 }
    );
  }

  // 自分自身を customer に変更するのを拒否
  if (params.id === currentUser.id && role === "customer") {
    return NextResponse.json(
      { error: "自分自身を customer に変更することはできません" },
      { status: 400 }
    );
  }

  // 対象ユーザーの存在確認
  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { role },
    select: { id: true, email: true, displayName: true, role: true },
  });

  return NextResponse.json(updated);
}
