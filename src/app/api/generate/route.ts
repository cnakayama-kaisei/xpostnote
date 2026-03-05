export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { maxSimilarity } from "@/lib/similarity";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth";

const SIMILARITY_THRESHOLD = 0.3;
const MAX_RETRIES = 3;

interface DraftData {
  text: string;
  intent: string;
  hook: string;
  structure: string;
  takeaways: string;
  ng_caution: string | null;
  summary: string;
  tags: string[];
  risk_flags: string[];
}

async function generateDrafts(
  client: Anthropic,
  benchmarkTexts: string[],
  styleInfo: string,
  theme: string,
  claim: string,
  episode: string | null,
  target: string | null,
  tone: string,
  ngWords: string | null
): Promise<DraftData[]> {
  const benchmarkSection =
    benchmarkTexts.length > 0
      ? `
## 参考ベンチマーク（構成・型のみ参考。文言・フレーズ・比喩の再利用は絶対禁止）
${benchmarkTexts.map((t, i) => `${i + 1}. ${t}`).join("\n")}
`
      : "";

  const prompt = `あなたはX（Twitter）のポスト作成の専門家です。
以下の条件でXポスト案を3つ生成してください。

## 絶対ルール
- ベンチマークの文言・フレーズ・比喩・固有表現を再利用しない（近似含む）
- 構成/情報順/読みやすさの「型」のみ参考にする
- 内容は必ずユーザー入力から構築する
- 特定アカウントの口調に寄せない

${benchmarkSection}

${styleInfo}

## ユーザー入力
- テーマ: ${theme}
- 主張/メッセージ: ${claim}
${episode ? `- 具体ネタ/エピソード: ${episode}` : ""}
${target ? `- ターゲット層: ${target}` : ""}
- トーン: ${tone}
${ngWords ? `- NGワード: ${ngWords}` : ""}

## 出力形式
以下のJSON配列を返してください。マークダウンのコードブロックは不要です。純粋なJSONのみ返してください。
[
  {
    "text": "ポスト本文（140文字程度推奨、最大280文字）",
    "intent": "このポストの意図",
    "hook": "フックの型（例: 問いかけ, 断言, 数字, 逆説）",
    "structure": "構成の型（例: 主張→根拠→CTA）",
    "takeaways": "読者が得るもの",
    "ng_caution": "NGワードに関する注意点（該当なしならnull）",
    "summary": "要約（1行）",
    "tags": ["タグ1", "タグ2"],
    "risk_flags": []
  }
]

## リスクフラグ判定
各ポストについて以下を判定し、該当するものをrisk_flagsに含めてください：
- "controversy": 炎上リスクあり
- "misinformation": 事実誤認の可能性
- "aggressive": 攻撃的表現あり`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  let jsonText = content.text.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  return JSON.parse(jsonText) as DraftData[];
}

export async function POST(req: NextRequest) {
  const appUser = await getAppUser();
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { theme, claim, episode, target, tone, ngWords } = body;

  if (!theme || !claim) {
    return NextResponse.json(
      { error: "テーマと主張は必須です" },
      { status: 400 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-api-key-here") {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEYが設定されていません。.env.localを確認してください。" },
      { status: 500 }
    );
  }

  const client = new Anthropic({ apiKey });

  const benchmarks = await prisma.benchmark.findMany({
    where: { userId: appUser.id },
    orderBy: { score: "desc" },
    take: 10,
  });
  const benchmarkTexts = benchmarks.map((b) => b.text);

  const styleProfiles = await prisma.styleProfile.findMany({
    where: { userId: appUser.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  let styleInfo = "";
  if (styleProfiles.length > 0) {
    styleInfo = `## 抽出済みスタイル特徴\n${styleProfiles
      .map(
        (s) =>
          `- フック: ${s.hookType}, 構成: ${s.structureType}, 平均文字数: ${s.avgLength}`
      )
      .join("\n")}`;
  }

  const generation = await prisma.generation.create({
    data: {
      userId: appUser.id,
      theme,
      claim,
      episode: episode || null,
      target: target || null,
      tone,
      ngWords: ngWords || null,
    },
  });

  let finalDrafts: DraftData[] = [];
  let retryCount = 0;
  let allPassed = false;

  while (retryCount < MAX_RETRIES && !allPassed) {
    const drafts = await generateDrafts(
      client,
      benchmarkTexts,
      styleInfo,
      theme,
      claim,
      episode,
      target,
      tone,
      ngWords
    );

    const checkedDrafts = drafts.map((d) => {
      const simScore = maxSimilarity(d.text, benchmarkTexts);
      return { ...d, similarityScore: simScore };
    });

    const passed = checkedDrafts.filter(
      (d) => d.similarityScore < SIMILARITY_THRESHOLD
    );
    const failed = checkedDrafts.filter(
      (d) => d.similarityScore >= SIMILARITY_THRESHOLD
    );

    finalDrafts = [...finalDrafts, ...passed];

    if (failed.length === 0 || finalDrafts.length >= 3) {
      allPassed = true;
    } else {
      retryCount++;
    }
  }

  if (finalDrafts.length === 0) {
    const drafts = await generateDrafts(
      client,
      benchmarkTexts,
      styleInfo,
      theme,
      claim,
      episode,
      target,
      tone,
      ngWords
    );
    finalDrafts = drafts.map((d) => {
      const simScore = maxSimilarity(d.text, benchmarkTexts);
      const flags = [...d.risk_flags];
      if (simScore >= 0.2) flags.push("similarity_warning");
      return { ...d, similarityScore: simScore, risk_flags: flags };
    });
  }

  finalDrafts = finalDrafts.slice(0, 3);

  finalDrafts = finalDrafts.map((d) => {
    const simScore = "similarityScore" in d ? (d as any).similarityScore : maxSimilarity(d.text, benchmarkTexts);
    const flags = [...d.risk_flags];
    if (simScore >= 0.2 && !flags.includes("similarity_warning")) {
      flags.push("similarity_warning");
    }
    return { ...d, similarityScore: simScore, risk_flags: flags };
  });

  const savedDrafts = await Promise.all(
    finalDrafts.map((d: any) =>
      prisma.draft.create({
        data: {
          generationId: generation.id,
          text: d.text,
          charCount: d.text.length,
          intent: d.intent,
          hook: d.hook,
          structure: d.structure,
          takeaways: d.takeaways,
          ngCaution: d.ng_caution || null,
          summary: d.summary,
          tags: JSON.stringify(d.tags),
          similarityScore: d.similarityScore,
          riskFlags: JSON.stringify(d.risk_flags),
          adopted: false,
        },
      })
    )
  );

  return NextResponse.json({
    generationId: generation.id,
    drafts: savedDrafts,
  });
}
