import Link from "next/link";

export default function Home() {
  return (
    <div className="text-center py-20">
      <h1 className="text-3xl font-bold mb-4">X Post Suggest</h1>
      <p className="text-gray-600 mb-8">
        バズったポストの「型」を学び、オリジナルのポスト案を生成
      </p>
      <div className="flex gap-4 justify-center">
        <Link
          href="/benchmarks"
          className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          ベンチマーク管理
        </Link>
        <Link
          href="/generate"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          ポスト生成
        </Link>
      </div>
    </div>
  );
}
