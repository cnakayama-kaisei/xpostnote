"use client";

import { useState, useEffect, useCallback } from "react";

interface Benchmark {
  id: number;
  url: string | null;
  text: string;
  likes: number;
  reposts: number;
  replies: number;
  quotes: number;
  score: number;
  postedAt: string | null;
  createdAt: string;
}

export default function BenchmarksPage() {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [likes, setLikes] = useState(0);
  const [reposts, setReposts] = useState(0);
  const [replies, setReplies] = useState(0);
  const [quotes, setQuotes] = useState(0);
  const [postedAt, setPostedAt] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchBenchmarks = useCallback(async () => {
    const res = await fetch("/api/benchmarks");
    const data = await res.json();
    setBenchmarks(data);
  }, []);

  useEffect(() => {
    fetchBenchmarks();
  }, [fetchBenchmarks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    await fetch("/api/benchmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: url || null,
        text,
        likes,
        reposts,
        replies,
        quotes,
        postedAt: postedAt || null,
      }),
    });
    setUrl("");
    setText("");
    setLikes(0);
    setReposts(0);
    setReplies(0);
    setQuotes(0);
    setPostedAt("");
    setLoading(false);
    fetchBenchmarks();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/benchmarks/${id}`, { method: "DELETE" });
    fetchBenchmarks();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ベンチマーク管理</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg border border-gray-200 mb-8"
      >
        <h2 className="text-lg font-semibold mb-4">ベンチマーク追加</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            XポストURL（任意）
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="https://x.com/..."
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            ポスト本文 *
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 h-24"
            required
          />
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Like</label>
            <input
              type="number"
              value={likes}
              onChange={(e) => setLikes(Number(e.target.value))}
              className="w-full border border-gray-300 rounded px-3 py-2"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Repost</label>
            <input
              type="number"
              value={reposts}
              onChange={(e) => setReposts(Number(e.target.value))}
              className="w-full border border-gray-300 rounded px-3 py-2"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reply</label>
            <input
              type="number"
              value={replies}
              onChange={(e) => setReplies(Number(e.target.value))}
              className="w-full border border-gray-300 rounded px-3 py-2"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quote</label>
            <input
              type="number"
              value={quotes}
              onChange={(e) => setQuotes(Number(e.target.value))}
              className="w-full border border-gray-300 rounded px-3 py-2"
              min={0}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            投稿日時（任意）
          </label>
          <input
            type="datetime-local"
            value={postedAt}
            onChange={(e) => setPostedAt(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "追加中..." : "追加"}
        </button>
      </form>

      <h2 className="text-lg font-semibold mb-4">
        一覧（{benchmarks.length}件、スコア順）
      </h2>

      {benchmarks.length === 0 ? (
        <p className="text-gray-500">ベンチマークがまだありません</p>
      ) : (
        <div className="space-y-4">
          {benchmarks.map((b) => (
            <div
              key={b.id}
              className="bg-white p-4 rounded-lg border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="whitespace-pre-wrap mb-2">{b.text}</p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>Score: {b.score.toFixed(1)}</span>
                    <span>Like: {b.likes}</span>
                    <span>RP: {b.reposts}</span>
                    <span>Reply: {b.replies}</span>
                    <span>QT: {b.quotes}</span>
                  </div>
                  {b.url && (
                    <p className="text-xs text-blue-500 mt-1 truncate">
                      {b.url}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="ml-4 text-red-500 hover:text-red-700 text-sm"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
