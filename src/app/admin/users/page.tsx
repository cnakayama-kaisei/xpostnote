import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UsersTable from "./UsersTable";

export default async function AdminUsersPage() {
  // admin以外は / にリダイレクト（middleware + ここの二重チェック）
  const currentUser = await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ユーザー管理</h1>
      <UsersTable users={users} currentUserId={currentUser.id} />
    </div>
  );
}
