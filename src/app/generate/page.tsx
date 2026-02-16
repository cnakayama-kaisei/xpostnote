"use client";

import { useState } from "react";

interface Draft {
  id: number;
  text: string;
  charCount: number;
  intent: string;
  hook: string;
  structure: string;
  takeaways: string;
  ngCaution: string | null;
  summary: string;
  tags: string;
  similarityScore: number;
  riskFlags: string;
  adopted: boolean;
}

const TONES = ["カジュアル", "ビジネス", "煽り", "共感", "ユーモア"];

export default function GeneratePage() {
  const [theme, setTheme] = useState("");
  const [claim, setClaim] = useState("");
  const [episode, setEpisode] = useState("");
  const [target, setTarget] = useState("");
  const [tone, setTone] = useState("カジュアル");
  const [ngWords, setNgWords] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [generationId, setGenerationId] = useState<number | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim() || !claim.trim()) return;
    setLoading(true);
    setError("");
    setDrafts([]);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          claim,
          episode: episode || null,
          target: target || null,
          tone,
          ngWords: ngWords || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "生成に失敗しました");
      }

      const data = await res.json();
      setDrafts(data.drafts);
      setGenerationId(data.generationId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdopt = async (draftId: number) => {
    await fetch(`/api/drafts/${draftId}/adopt`, { method: "PATCH" });
    setDrafts((prev) =>
      prev.map((d) => (d.id === draftId ? { ...d, adopted: true } : d))
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const parseTags = (tags: string): string[] => {
    try {
      return JSON.parse(tags);
    } catch {
      return [];
    }
  };

  const parseRiskFlags = (flags: string): string[] => {
    try {
      return JSON.parse(flags);
    } catch {
      return [];
    }
  };

  const riskLabel = (flag: string) => {
    const map: Record<string, string> = {
      similarity_warning: "類似度注意",
      controversy: "炎上リスク",
      misinformation: "事実誤認の可能性",
      aggressive: "攻撃的表現",
    };
    return map[flag] || flag;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ポスト生成</h1>

      <form
        onSubmit={handleGenerate}
        className="bg-white p-6 rounded-lg border border-gray-200 mb-8"
      >
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">テーマ *</label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="例: プログラミング学習"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">トーン</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            主張/メッセージ *
          </label>
          <textarea
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 h-20"
            placeholder="例: 初心者はまずアウトプットから始めるべき"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            具体ネタ/エピソード（任意）
          </label>
          <textarea
            value={episode}
            onChange={(e) => setEpisode(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 h-16"
            placeholder="例: 自分が最初のアプリを作った時の体験"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              ターゲット層（任意）
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="例: プログラミング初心者"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              NGワード（任意、カンマ区切り）
            </label>
            <input
              type="text"
              value={ngWords}
              onChange={(e) => setNgWords(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="例: スクール,情報商材"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "生成中..." : "3案生成"}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">ポスト案を生成中...</p>
        </div>
      )}

      {drafts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">生成結果</h2>
          <div className="space-y-4">
            {drafts.map((draft, i) => {
              const tags = parseTags(draft.tags);
              const risks = parseRiskFlags(draft.riskFlags);
              return (
                <div
                  key={draft.id}
                  className={`bg-white p-6 rounded-lg border ${
                    draft.adopted
                      ? "border-green-400 bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-medium text-gray-500">
                      案 {i + 1}
                    </span>
                    <span className="text-sm text-gray-500">
                      {draft.charCount}文字
                    </span>
                  </div>

                  <p className="text-lg whitespace-pre-wrap mb-4">
                    {draft.text}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">フック:</span> {draft.hook}
                    </div>
                    <div>
                      <span className="font-medium">構成:</span>{" "}
                      {draft.structure}
                    </div>
                    <div>
                      <span className="font-medium">意図:</span> {draft.intent}
                    </div>
                    <div>
                      <span className="font-medium">類似度:</span>{" "}
                      {(draft.similarityScore * 100).toFixed(1)}%
                    </div>
                  </div>

                  {risks.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {risks.map((flag) => (
                        <span
                          key={flag}
                          className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded"
                        >
                          {riskLabel(flag)}
                        </span>
                      ))}
                    </div>
                  )}

                  {tags.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!draft.adopted && (
                      <button
                        onClick={() => handleAdopt(draft.id)}
                        className="px-4 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        採用
                      </button>
                    )}
                    {draft.adopted && (
                      <span className="px-4 py-1.5 bg-green-100 text-green-700 text-sm rounded">
                        採用済み
                      </span>
                    )}
                    <button
                      onClick={() => handleCopy(draft.text)}
                      className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                    >
                      コピー
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
