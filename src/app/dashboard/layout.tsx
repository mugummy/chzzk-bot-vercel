import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Professional Bot Dashboard",
  description: "Next-gen Chzzk management system",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050505] selection:bg-emerald-500/30">
      {children}
    </div>
  );
}