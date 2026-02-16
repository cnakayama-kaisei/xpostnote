"use client";

import { useState, useEffect, useCallback } from "react";

interface Draft {
  id: number;
  text: string;
  charCount: number;
  hook: string;
  structure: string;
  similarityScore: number;
  riskFlags: string;
  adopted: boolean;
}

interface Generation {
  id: number;
  theme: string;
  claim: string;
  episode: string | null;
  target: string | null;
  tone: string;
  ngWords: string | null;
  drafts: Draft[];
  createdAt: string;
}

export default function HistoryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [filter, setFilter] = useState<"all" | "adopted" | "not_adopted">(
    "all"
  );
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchGenerations = useCallback(async () => {
    const res = await fetch("/api/generations");
    const data = await res.json();
    setGenerations(data);
  }, []);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  const handleAdopt = async (draftId: number) => {
    await fetch(`/api/drafts/${draftId}/adopt`, { method: "PATCH" });
    fetchGenerations();
  };

  const filtered = generations.filter((g) => {
    if (filter === "adopted")
      return g.drafts.some((d) => d.adopted);
    if (filter === "not_adopted")
      return !g.drafts.some((d) => d.adopted);
    return true;
  });

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
      <h1 className="text-2xl font-bold mb-6">生成履歴</h1>

      <div className="flex gap-2 mb-6">
        {(
          [
            ["all", "すべて"],
            ["adopted", "採用済み"],
            ["not_adopted", "未採用"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded text-sm ${
              filter === key
                ? "bg-black text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">履歴がありません</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((gen) => (
            <div
              key={gen.id}
              className="bg-white rounded-lg border border-gray-200"
            >
              <div
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() =>
                  setExpandedId(expandedId === gen.id ? null : gen.id)
                }
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{gen.theme}</span>
                    <span className="text-gray-500 text-sm ml-3">
                      {gen.tone}
                    </span>
                    {gen.drafts.some((d) => d.adopted) && (
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                        採用あり
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(gen.createdAt).toLocaleString("ja-JP")}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1 truncate">
                  {gen.claim}
                </p>
              </div>

              {expandedId === gen.id && (
                <div className="border-t border-gray-200 p-4">
                  <div className="text-sm text-gray-600 mb-4 space-y-1">
                    <p>
                      <span className="font-medium">テーマ:</span> {gen.theme}
                    </p>
                    <p>
                      <span className="font-medium">主張:</span> {gen.claim}
                    </p>
                    {gen.episode && (
                      <p>
                        <span className="font-medium">エピソード:</span>{" "}
                        {gen.episode}
                      </p>
                    )}
                    {gen.target && (
                      <p>
                        <span className="font-medium">ターゲット:</span>{" "}
                        {gen.target}
                      </p>
                    )}
                    {gen.ngWords && (
                      <p>
                        <span className="font-medium">NGワード:</span>{" "}
                        {gen.ngWords}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {gen.drafts.map((draft, i) => {
                      const risks = parseRiskFlags(draft.riskFlags);
                      return (
                        <div
                          key={draft.id}
                          className={`p-3 rounded border ${
                            draft.adopted
                              ? "border-green-300 bg-green-50"
                              : "border-gray-100 bg-gray-50"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-gray-500">
                              案 {i + 1} / {draft.charCount}文字 / 類似度{" "}
                              {(draft.similarityScore * 100).toFixed(1)}%
                            </span>
                            <div className="flex gap-2">
                              {draft.adopted ? (
                                <span className="text-xs text-green-600">
                                  採用済み
                                </span>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAdopt(draft.id);
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  採用する
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="whitespace-pre-wrap text-sm">
                            {draft.text}
                          </p>
                          {risks.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {risks.map((flag) => (
                                <span
                                  key={flag}
                                  className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded"
                                >
                                  {riskLabel(flag)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
