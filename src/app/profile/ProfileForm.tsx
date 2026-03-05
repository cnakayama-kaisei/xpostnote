"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  email: string;
  displayName: string | null;
  role: string;
}

export default function ProfileForm({ email, displayName, role }: Props) {
  const router = useRouter();
  const [name, setName] = useState(displayName ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: name.trim() || null }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrorMsg(data.error ?? "保存に失敗しました");
      setStatus("error");
      return;
    }

    setStatus("ok");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* email（表示のみ） */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          メールアドレス
        </label>
        <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-gray-800">
          {email}
        </p>
      </div>

      {/* role（表示のみ） */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ロール
        </label>
        <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-gray-800">
          {role === "admin" ? (
            <>
              {role}
              <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-1 rounded">
                admin
              </span>
            </>
          ) : (
            role
          )}
        </p>
      </div>

      {/* displayName（編集可） */}
      <div>
        <label
          htmlFor="displayName"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          表示名
        </label>
        <input
          id="displayName"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setStatus("idle");
          }}
          placeholder="表示名を入力（任意）"
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {status === "ok" && (
        <p className="text-green-600 text-sm">保存しました</p>
      )}
      {status === "error" && (
        <p className="text-red-600 text-sm">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "saving"}
        className="w-full bg-black text-white rounded px-4 py-2 font-medium hover:bg-gray-800 disabled:opacity-50"
      >
        {status === "saving" ? "保存中..." : "保存する"}
      </button>
    </form>
  );
}
