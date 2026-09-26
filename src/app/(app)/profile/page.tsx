import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import React from "react";
import { EditProfileForm } from "@/components/profile/EditProfileForm";

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

  const formattedDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-xl mx-auto">
      <div className="pb-5 mb-6 border-b border-[var(--color-line)]">
        <h1 className="text-xl font-bold tracking-tight text-[var(--color-anthracite)] font-mono uppercase">
          User Profile
        </h1>
        <p className="text-xs text-[var(--color-muted)] mt-0.5">
          Account credentials, operational role assignment, and editable display name.
        </p>
      </div>

      <EditProfileForm
        initialName={user.name}
        loginId={user.loginId}
        role={user.role}
        userId={user.id}
        createdAt={formattedDate}
      />

      {/* Session Controls */}
      <div className="mt-6 bg-white border border-[var(--color-line)] rounded-md p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-[var(--color-ink)] block">
            Active Authentication Session
          </span>
          <span className="text-[11px] text-[var(--color-muted)] font-mono">
            Signed in as {user.loginId}
          </span>
        </div>
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

      {/* Footer Navigation */}
      <div className="mt-6 flex justify-center space-x-4 text-xs text-[var(--color-muted)]">
        <Link href="/privacy" className="hover:text-[var(--color-ink)] hover:underline">
          Privacy Policy
        </Link>
        <span aria-hidden="true">&middot;</span>
        <Link href="/terms" className="hover:text-[var(--color-ink)] hover:underline">
          Terms of Service
        </Link>
      </div>
    </div>
  );
}
