"use client";

import React, { useState, useTransition } from "react";
import { updateDisplayName } from "@/app/actions/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface EditProfileFormProps {
  initialName: string;
  loginId: string;
  role: string;
  userId: string;
  createdAt: string;
}

export function EditProfileForm({
  initialName,
  loginId,
  role,
  userId,
  createdAt,
}: EditProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const formData = new FormData();
    formData.append("name", name);

    startTransition(async () => {
      const res = await updateDisplayName(formData);
      if (res.ok) {
        setMessage({ type: "success", text: "Display name updated successfully!" });
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to update display name" });
      }
    });
  };

  return (
    <div className="bg-white border border-[var(--color-line)] rounded-md shadow-2xs overflow-hidden">
      {/* Profile Header Banner */}
      <div className="p-6 border-b border-[var(--color-line)] bg-[#F8F9FA] flex items-center space-x-4">
        <div className="w-14 h-14 rounded bg-[var(--color-anthracite)] text-white font-bold text-lg flex items-center justify-center border border-[#3C4654]">
          {name ? name.slice(0, 2).toUpperCase() : "US"}
        </div>
        <div>
          <h2 className="text-base font-bold text-[var(--color-ink)]">
            {name || "User"}
          </h2>
          <div className="flex items-center space-x-2 mt-1">
            <span
              className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                role === "MANAGER"
                  ? "bg-[#FEF3D6] text-[#9A6214] border border-[#F9DE96]"
                  : "bg-[#E6F4EA] text-[#2E7D4F] border border-[#A8DAB5]"
              }`}
            >
              {role}
            </span>
            <span className="text-xs text-[var(--color-muted)] font-mono">
              {loginId}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {message && (
          <div
            className={`p-3 rounded-md text-xs border ${
              message.type === "success"
                ? "bg-[#E6F4EA] text-[#2E7D4F] border-[#A8DAB5]"
                : "bg-[#FCE8E6] text-[#B23A34] border-[#F5C2BE]"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Display Name (Editable) */}
        <div>
          <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
            Display Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="w-full text-xs px-3 py-2 border border-[var(--color-line)] rounded-md bg-[#FBFBFA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)] text-[var(--color-ink)]"
          />
          <p className="text-[11px] text-[var(--color-muted)] mt-1">
            This name will be displayed across the warehouse audit trail and user navigation.
          </p>
        </div>

        {/* Login ID (Read-only) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-[var(--color-muted)]">
              Login ID
            </label>
            <span className="text-[10px] uppercase font-mono text-[var(--color-muted)] bg-[#EDEDEA] px-1.5 py-0.2 rounded">
              Read-Only
            </span>
          </div>
          <input
            type="text"
            readOnly
            disabled
            value={loginId}
            className="w-full text-xs font-mono px-3 py-2 border border-[var(--color-line)] rounded-md bg-[#F1F3F4] text-[#5F6368] cursor-not-allowed select-none"
          />
          <p className="text-[11px] text-[var(--color-muted)] mt-1">
            Registered login credential. Cannot be modified directly.
          </p>
        </div>

        {/* Operational Role (Read-only) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-[var(--color-muted)]">
              Operational Role
            </label>
            <span className="text-[10px] uppercase font-mono text-[var(--color-muted)] bg-[#EDEDEA] px-1.5 py-0.2 rounded">
              Read-Only
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 border border-[var(--color-line)] rounded-md bg-[#F1F3F4]">
            <span className="font-semibold text-xs text-[var(--color-ink)]">
              {role}
            </span>
            <span className="text-[11px] text-[var(--color-muted)]">
              {role === "MANAGER" ? "Full warehouse administration" : "Standard operations & inventory tracking"}
            </span>
          </div>
        </div>

        {/* Account Metadata */}
        <div className="pt-2 border-t border-[#F0F0EC] space-y-2 text-xs">
          <div className="flex justify-between py-1 text-[var(--color-muted)]">
            <span>User ID:</span>
            <span className="font-mono text-[var(--color-ink)]">{userId}</span>
          </div>
          <div className="flex justify-between py-1 text-[var(--color-muted)]">
            <span>Member Since:</span>
            <span className="font-mono text-[var(--color-ink)]">{createdAt}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-[var(--color-line)] flex items-center justify-end">
          <button
            type="submit"
            disabled={isPending || name.trim() === initialName}
            className="px-4 py-2 bg-[var(--color-amber)] hover:bg-[#A36718] text-white rounded text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Saving..." : "Save Display Name"}
          </button>
        </div>
      </form>

      {/* Policy Links & Legal footer inside profile card */}
      <div className="px-6 py-4 border-t border-[var(--color-line)] bg-[#F8F9FA] flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-[var(--color-muted)] gap-2">
        <div className="flex items-center space-x-3">
          <Link href="/privacy" className="text-[var(--color-amber)] hover:underline font-medium">
            Privacy Policy
          </Link>
          <span>&middot;</span>
          <Link href="/terms" className="text-[var(--color-amber)] hover:underline font-medium">
            Terms of Service
          </Link>
        </div>
        <span className="text-[11px]">StockSense Demo Build</span>
      </div>
    </div>
  );
}
