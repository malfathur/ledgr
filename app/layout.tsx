import type { Metadata } from "next";
import { ensureDb } from "@/lib/db";
import "./globals.css";

export const metadata: Metadata = {
  title: "L.E.D.G.R",
  description: "A self-hosted personal finance tracker",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureDb();
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">{children}</body>
    </html>
  );
}
