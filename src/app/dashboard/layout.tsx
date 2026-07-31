import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import Sidebar from "@/components/dashboard/Sidebar";
import HeaderNav from "@/components/dashboard/HeaderNav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "guard") redirect("/login");

  const roleLabel = ROLE_LABELS[session.role] || session.role;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      <HeaderNav
        session={{
          id: session.id,
          name: session.name,
          role: session.role,
        }}
        roleLabel={roleLabel}
      />
      <div className="flex flex-1 min-h-[calc(100vh-56px)]">
        <Sidebar role={session.role} />
        <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
