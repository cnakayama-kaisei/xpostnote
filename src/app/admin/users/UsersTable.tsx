"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  createdAt: Date | string;
}

interface Props {
  users: User[];
  currentUserId: string;
}

export default function UsersTable({ users, currentUserId }: Props) {
  const router = useRouter();
  // 各行の状態を id → { pendingRole, loading, error } で管理
  const [states, setStates] = useState<
    Record<string, { pendingRole: string; loading: boolean; error: string }>
  >(
    Object.fromEntries(
      users.map((u) => [u.id, { pendingRole: u.role, loading: false, error: "" }])
    )
  );

  function setPendingRole(id: string, role: string) {
    setStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], pendingRole: role, error: "" },
    }));
  }

  async function handleRoleChange(user: User) {
    const { pendingRole } = states[user.id];
    if (pendingRole === user.role) return;

    // 自分自身を customer に落とす操作を拒否
    if (user.id === currentUserId && pendingRole === "customer") {
      setStates((prev) => ({
        ...prev,
        [user.id]: {
          ...prev[user.id],
          error: "自分自身を customer に変更することはできません",
          pendingRole: user.role,
        },
      }));
      return;
    }

    setStates((prev) => ({
      ...prev,
      [user.id]: { ...prev[user.id], loading: true, error: "" },
    }));

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: pendingRole }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStates((prev) => ({
        ...prev,
        [user.id]: {
          ...prev[user.id],
          loading: false,
          error: data.error ?? "更新に失敗しました",
          pendingRole: user.role,
        },
      }));
      return;
    }

    setStates((prev) => ({
      ...prev,
      [user.id]: { ...prev[user.id], loading: false },
    }));
    router.refresh(); // サーバーコンポーネントを再取得してテーブルを最新化
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50 text-gray-600 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">メール</th>
            <th className="px-4 py-3 font-medium">表示名</th>
            <th className="px-4 py-3 font-medium">ロール</th>
            <th className="px-4 py-3 font-medium">登録日</th>
            <th className="px-4 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((user) => {
            const s = states[user.id];
            const isSelf = user.id === currentUserId;
            return (
              <tr key={user.id} className="bg-white hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-800">
                  {user.email}
                  {isSelf && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1 rounded">
                      自分
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {user.displayName ?? <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={s.pendingRole}
                    onChange={(e) => setPendingRole(user.id, e.target.value)}
                    disabled={s.loading}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="customer">customer</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString("ja-JP")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleRoleChange(user)}
                      disabled={s.loading || s.pendingRole === user.role}
                      className="px-3 py-1 text-sm bg-black text-white rounded hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {s.loading ? "更新中..." : "変更"}
                    </button>
                    {s.error && (
                      <p className="text-red-600 text-xs">{s.error}</p>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
