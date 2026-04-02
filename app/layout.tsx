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
    <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function () {
              var saved = localStorage.getItem("theme-mode");
              var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
              var theme = saved || (systemDark ? "dark" : "light");
              document.documentElement.dataset.theme = theme;
              document.documentElement.style.colorScheme = theme;
            })();
          `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
