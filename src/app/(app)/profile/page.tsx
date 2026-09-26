import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import React from "react";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="pb-5 mb-6 border-b border-[var(--color-line)]">
        <h1 className="text-xl font-bold tracking-tight text-[var(--color-anthracite)] font-mono uppercase">
          User Profile
        </h1>
        <p className="text-xs text-[var(--color-muted)] mt-0.5">
          Account credentials, role assignment, and session security.
        </p>
      </div>

      <div className="bg-white border border-[var(--color-line)] rounded-md shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-[var(--color-line)] bg-[#F8F9FA] flex items-center space-x-4">
          <div className="w-14 h-14 rounded bg-[var(--color-anthracite)] text-white font-bold text-lg flex items-center justify-center border border-[#3C4654]">
            {user.name ? user.name.slice(0, 2).toUpperCase() : "US"}
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--color-ink)]">
              {user.name}
            </h2>
            <div className="flex items-center space-x-2 mt-1">
              <span
                className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                  user.role === "MANAGER"
                    ? "bg-[#FEF3D6] text-[#9A6214] border border-[#F9DE96]"
                    : "bg-[#E6F4EA] text-[#2E7D4F] border border-[#A8DAB5]"
                }`}
              >
                {user.role}
              </span>
              <span className="text-xs text-[var(--color-muted)] font-mono">
                {user.loginId}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="flex justify-between py-2 border-b border-[#F0F0EC]">
            <span className="font-semibold text-[var(--color-muted)]">User ID</span>
            <span className="font-mono text-[var(--color-ink)]">{user.id}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#F0F0EC]">
            <span className="font-semibold text-[var(--color-muted)]">Registered Login</span>
            <span className="font-mono text-[var(--color-ink)]">{user.loginId}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#F0F0EC]">
            <span className="font-semibold text-[var(--color-muted)]">Operational Role</span>
            <span className="font-semibold text-[var(--color-ink)]">{user.role}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#F0F0EC]">
            <span className="font-semibold text-[var(--color-muted)]">Account Created</span>
            <span className="font-mono text-[var(--color-muted)]">
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--color-line)] bg-[#F8F9FA] flex items-center justify-between">
          <span className="text-xs text-[var(--color-muted)]">Active Session</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-[#FCE8E6] text-[#B23A34] hover:bg-[#F9D6D3] rounded text-xs font-semibold border border-[#F5C2BE] transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>

      <div className="mt-6 flex justify-center space-x-4 text-xs text-[var(--color-muted)]">
        <Link href="/privacy" className="hover:text-[var(--color-ink)]">Privacy Policy</Link>
        <span aria-hidden="true">&middot;</span>
        <Link href="/terms" className="hover:text-[var(--color-ink)]">Terms of Service</Link>
      </div>
    </div>
  );
}
