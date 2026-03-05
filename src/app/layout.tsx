import "./globals.css";
import NavBar from "@/components/NavBar";

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
        <NavBar />
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
