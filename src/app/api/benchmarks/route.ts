export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function calcScore(likes: number, reposts: number, replies: number, quotes: number): number {
  return likes + reposts * 2 + replies + quotes * 1.5;
}

export async function GET() {
  const benchmarks = await prisma.benchmark.findMany({
    orderBy: { score: "desc" },
  });
  return NextResponse.json(benchmarks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { url, text, likes = 0, reposts = 0, replies = 0, quotes = 0, postedAt } = body;

  if (!text || text.trim() === "") {
    return NextResponse.json({ error: "テキストは必須です" }, { status: 400 });
  }

  const score = calcScore(likes, reposts, replies, quotes);

  const benchmark = await prisma.benchmark.create({
    data: {
      url: url || null,
      text,
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
