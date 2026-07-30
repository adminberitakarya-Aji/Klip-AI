import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen flex"
      style={{ background: "oklch(0.04 0 0)" }}
    >
      <DashboardSidebar />

      {/* Main content — offset by sidebar width */}
      <div className="flex-1 lg:pl-[240px] transition-all duration-300">
        {children}
      </div>
    </div>
  );
}
