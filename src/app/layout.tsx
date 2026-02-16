import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "X Post Suggest",
  description: "Xポストサジェストアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <header className="bg-white border-b border-gray-200">
          <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">
            <span className="font-bold text-lg">X Post Suggest</span>
            <Link href="/benchmarks" className="text-gray-600 hover:text-black">
              ベンチマーク
            </Link>
            <Link href="/generate" className="text-gray-600 hover:text-black">
              ポスト生成
            </Link>
            <Link href="/history" className="text-gray-600 hover:text-black">
              履歴
            </Link>
          </nav>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
