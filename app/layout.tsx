import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CE Mercante vs BL — Brasporto",
  description: "Auditoria e conformidade documental para importação marítima",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
