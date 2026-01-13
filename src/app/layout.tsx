import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BUZZK PRO - Ultimate Streaming Dashboard",
  description: "Enterprise-grade Chzzk management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${inter.className} bg-[#050505] antialiased custom-scrollbar`}>
        {children}
      </body>
    </html>
  );
}