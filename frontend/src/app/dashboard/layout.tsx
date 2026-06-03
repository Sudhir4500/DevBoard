
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <main className="flex h-screen flex-col overflow-y-auto">{children}</main>
    </div>
  );
}