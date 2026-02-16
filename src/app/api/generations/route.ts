export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const generations = await prisma.generation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      drafts: true,
    },
  });
  return NextResponse.json(generations);
}
