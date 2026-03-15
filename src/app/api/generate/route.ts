export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { maxSimilarity } from "@/lib/similarity";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth";

const SIMILARITY_THRESHOLD = 0.3;
const MAX_RETRIES = 3;

type Mode = "tweet" | "article" | "list";

interface DraftData {
  title?: string;
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

function buildPrompt(
  mode: Mode,
  benchmarkTexts: string[],
  styleInfo: string,
  theme: string,
  claim: string,
  episode: string | null,
  target: string | null,
  tone: string,
  ngWords: string | null
): string {
  const benchmarkSection =
    benchmarkTexts.length > 0
      ? `\n## 参考ベンチマーク（構成・型のみ参考。文言・フレーズ・比喩の再利用は絶対禁止）\n${benchmarkTexts.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n`
      : "";

  const modeRules: Record<Mode, string> = {
    tweet: `## 出力モード: 140字ポスト
- 全体で140字以内に厳守
- 1投稿 = 1メッセージ（スレッド不可）
- "text" フィールドに本文を入れること`,

    article: `## 出力モード: 500字X記事
- タイトル（20字以内）と本文（400〜500字）を必ず分けること
- "title" フィールドにタイトル、"text" フィールドに本文を入れること
- 本文は段落構成（冒頭フック→詳細→締め）
- 本文の文字数: 400字以上500字以下を厳守`,

    list: `## 出力モード: 140字箇条書き
- 全体で140字以内に厳守
- 箇条書き形式（「・〇〇」形式）
- 各行（箇条書き1項目）は15字以内を厳守（スマホでの改行防止のため）
- "text" フィールドに本文を入れること`,
  };

  const outputFormat =
    mode === "article"
      ? `## 出力形式
以下のJSON配列を返してください。マークダウンのコードブロックは不要です。純粋なJSONのみ返してください。
[
  {
    "title": "タイトル（20字以内）",
    "text": "本文（400〜500字）",
    "intent": "このポストの意図",
    "hook": "フックの型",
    "structure": "構成の型",
    "takeaways": "読者が得るもの",
    "ng_caution": null,
    "summary": "要約（1行）",
    "tags": ["タグ1"],
    "risk_flags": []
  }
]`
      : `## 出力形式
以下のJSON配列を返してください。マークダウンのコードブロックは不要です。純粋なJSONのみ返してください。
[
  {
    "text": "本文",
    "intent": "このポストの意図",
    "hook": "フックの型（例: 問いかけ, 断言, 数字, 逆説）",
    "structure": "構成の型（例: 主張→根拠→CTA）",
    "takeaways": "読者が得るもの",
    "ng_caution": null,
    "summary": "要約（1行）",
    "tags": ["タグ1"],
    "risk_flags": []
  }
]`;

  return `あなたはX（Twitter）のポスト作成の専門家です。
以下の条件でXポスト案を3つ生成してください。

## 絶対ルール
- ベンチマークの文言・フレーズ・比喩・固有表現を再利用しない（近似含む）
- 構成/情報順/読みやすさの「型」のみ参考にする
- 内容は必ずユーザー入力から構築する
- 特定アカウントの口調に寄せない
- 3案は互いに異なるフック型・構成を使うこと

${modeRules[mode]}

${benchmarkSection}
${styleInfo}

## ユーザー入力
- テーマ: ${theme}
- 主張/メッセージ: ${claim}
${episode ? `- 具体ネタ/エピソード: ${episode}` : ""}
${target ? `- ターゲット層: ${target}` : ""}
- トーン: ${tone}
${ngWords ? `- NGワード: ${ngWords}` : ""}

${outputFormat}

## リスクフラグ判定
各ポストについて以下を判定し、該当するものをrisk_flagsに含めてください：
- "controversy": 炎上リスクあり
- "misinformation": 事実誤認の可能性
- "aggressive": 攻撃的表現あり`;
}

async function callClaude(
  client: Anthropic,
  mode: Mode,
  benchmarkTexts: string[],
  styleInfo: string,
  theme: string,
  claim: string,
  episode: string | null,
  target: string | null,
  tone: string,
  ngWords: string | null
): Promise<DraftData[]> {
  const prompt = buildPrompt(mode, benchmarkTexts, styleInfo, theme, claim, episode, target, tone, ngWords);

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
  const { theme, claim, episode, target, tone, ngWords, mode = "tweet" } = body;

  if (!theme || !claim) {
    return NextResponse.json({ error: "テーマと主張は必須です" }, { status: 400 });
  }

  if (!["tweet", "article", "list"].includes(mode)) {
    return NextResponse.json({ error: "mode は tweet / article / list のいずれかを指定してください" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-api-key-here") {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEYが設定されていません。.env.localを確認してください。" },
      { status: 500 }
    );
  }

  const client = new Anthropic({ apiKey });

  // モードに対応するカテゴリのベンチマークのみ使用
  const benchmarks = await prisma.benchmark.findMany({
    where: { userId: appUser.id, category: mode },
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
      .map((s) => `- フック: ${s.hookType}, 構成: ${s.structureType}, 平均文字数: ${s.avgLength}`)
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
      mode,
    },
  });

  let finalDrafts: (DraftData & { similarityScore: number })[] = [];
  let retryCount = 0;

  while (retryCount < MAX_RETRIES && finalDrafts.length < 3) {
    const drafts = await callClaude(client, mode as Mode, benchmarkTexts, styleInfo, theme, claim, episode, target, tone, ngWords);
    for (const d of drafts) {
      if (finalDrafts.length >= 3) break;
      const checkText = mode === "article" ? `${d.title || ""} ${d.text}` : d.text;
      const simScore = maxSimilarity(checkText, benchmarkTexts);
      if (simScore < SIMILARITY_THRESHOLD) {
        finalDrafts.push({ ...d, similarityScore: simScore });
      }
    }
    retryCount++;
  }

  // 3案に満たない場合は類似度警告付きで補充
  if (finalDrafts.length < 3) {
    const drafts = await callClaude(client, mode as Mode, benchmarkTexts, styleInfo, theme, claim, episode, target, tone, ngWords);
    for (const d of drafts) {
      if (finalDrafts.length >= 3) break;
      const checkText = mode === "article" ? `${d.title || ""} ${d.text}` : d.text;
      const simScore = maxSimilarity(checkText, benchmarkTexts);
      const flags = [...d.risk_flags];
      if (simScore >= 0.2) flags.push("similarity_warning");
      finalDrafts.push({ ...d, similarityScore: simScore, risk_flags: flags });
    }
  }

  finalDrafts = finalDrafts.slice(0, 3);

  const savedDrafts = await Promise.all(
    finalDrafts.map((d) =>
      prisma.draft.create({
        data: {
          generationId: generation.id,
          title: d.title || null,
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

  return NextResponse.json({ generationId: generation.id, drafts: savedDrafts });
}
