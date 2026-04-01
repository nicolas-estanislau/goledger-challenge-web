import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoLedger ScreenVault",
  description: "IMDb-like interface for managing TV shows, seasons, episodes, and watchlists on GoLedger.",
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
