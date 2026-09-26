import { auth } from "@/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { redirect } from "next/navigation";
import React from "react";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
    role: (session.user as any)?.role,
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)]">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <React.Suspense fallback={<div className="h-16 bg-white border-b border-[var(--color-line)]" />}>
          <TopBar />
        </React.Suspense>
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
