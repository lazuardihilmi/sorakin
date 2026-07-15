import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sorakin - Platform Monetisasi & Tip Kreator",
  description: "Dukung kreator favoritmu secara langsung dan mudah melalui Sorakin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        {children}
      </body>
    </html>
  );
}
