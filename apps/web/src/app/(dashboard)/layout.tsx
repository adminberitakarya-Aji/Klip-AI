import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen flex text-white select-none"
      style={{ background: "oklch(0.04 0 0)" }}
    >
      <DashboardSidebar />

      {/* Main Studio Canvas - offset by 224px sidebar */}
      <main className="flex-1 pl-56 min-h-screen">{children}</main>
    </div>
  );
}
