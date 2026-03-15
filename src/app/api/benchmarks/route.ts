export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth";

function calcScore(likes: number, reposts: number, replies: number, quotes: number): number {
  return likes + reposts * 2 + replies + quotes * 1.5;
}

export async function GET(req: NextRequest) {
  const appUser = await getAppUser();
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "tweet";

  const benchmarks = await prisma.benchmark.findMany({
    where: { userId: appUser.id, category },
    orderBy: { score: "desc" },
  });
  return NextResponse.json(benchmarks);
}

export async function POST(req: NextRequest) {
  const appUser = await getAppUser();
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { url, text, category = "tweet", likes = 0, reposts = 0, replies = 0, quotes = 0, postedAt } = body;

  if (!text || text.trim() === "") {
    return NextResponse.json({ error: "テキストは必須です" }, { status: 400 });
  }

  if (!["tweet", "article", "list"].includes(category)) {
    return NextResponse.json({ error: "category は tweet / article / list のいずれかを指定してください" }, { status: 400 });
  }

  const score = calcScore(likes, reposts, replies, quotes);

  const benchmark = await prisma.benchmark.create({
    data: {
      userId: appUser.id,
      url: url || null,
      text,
      category,
      likes,
      reposts,
      replies,
      quotes,
      score,
      postedAt: postedAt ? new Date(postedAt) : null,
    },
  });

  return NextResponse.json(benchmark, { status: 201 });
}
