"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import React from "react";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const isManager = user.role === "MANAGER";

  const isLinkActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const navItemClass = (href: string) => {
    const active = isLinkActive(href);
    return `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      active
        ? "bg-[#282F38] text-white border-l-2 border-[#B9791F] pl-2.5"
        : "text-[#9CA3AF] hover:text-white hover:bg-[#232932]"
    }`;
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-[#1C2127] text-white flex flex-col min-h-screen border-r border-[#2B323D]">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-[#2B323D] bg-[#171B20]">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded bg-[#B9791F] flex items-center justify-center text-white font-bold text-base shadow-xs">
            S
          </div>
          <div>
            <span className="font-semibold text-base tracking-tight text-white block leading-tight">
              StockSense
            </span>
            <span className="text-[11px] text-[#8C95A3] tracking-wide uppercase font-mono">
              Operations
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {/* Core Management */}
        <div className="space-y-1">
          <Link href="/dashboard" className={navItemClass("/dashboard")}>
            <svg
              className="mr-3 h-4 w-4 flex-shrink-0 text-[#9CA3AF] group-hover:text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            Dashboard
          </Link>
          <Link href="/products" className={navItemClass("/products")}>
            <svg
              className="mr-3 h-4 w-4 flex-shrink-0 text-[#9CA3AF] group-hover:text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            Products
          </Link>
          <Link href="/stock" className={navItemClass("/stock")}>
            <svg
              className="mr-3 h-4 w-4 flex-shrink-0 text-[#9CA3AF] group-hover:text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Stock
          </Link>
        </div>

        {/* Operations Section */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#737C8A]">
            Operations
          </div>
          <div className="space-y-1">
            <Link href="/operations/receipts" className={navItemClass("/operations/receipts")}>
              <svg
                className="mr-3 h-4 w-4 flex-shrink-0 text-[#9CA3AF] group-hover:text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
              Receipts
            </Link>
            <Link href="/operations/deliveries" className={navItemClass("/operations/deliveries")}>
              <svg
                className="mr-3 h-4 w-4 flex-shrink-0 text-[#9CA3AF] group-hover:text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              Delivery Orders
            </Link>
            <Link href="/operations/transfers" className={navItemClass("/operations/transfers")}>
              <svg
                className="mr-3 h-4 w-4 flex-shrink-0 text-[#9CA3AF] group-hover:text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              Internal Transfers
            </Link>
            <Link href="/operations/adjustments" className={navItemClass("/operations/adjustments")}>
              <svg
                className="mr-3 h-4 w-4 flex-shrink-0 text-[#9CA3AF] group-hover:text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              Inventory Adjustment
            </Link>
            <Link href="/operations/moves" className={navItemClass("/operations/moves")}>
              <svg
                className="mr-3 h-4 w-4 flex-shrink-0 text-[#9CA3AF] group-hover:text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              Move History
            </Link>
          </div>
        </div>

        {/* Settings Section (Manager Only: completely hidden for Staff) */}
        {isManager && (
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#737C8A]">
              Settings
            </div>
            <div className="space-y-1">
              <Link href="/settings/warehouses" className={navItemClass("/settings/warehouses")}>
                <svg
                  className="mr-3 h-4 w-4 flex-shrink-0 text-[#9CA3AF] group-hover:text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                Warehouses
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Profile & Logout Menu at Bottom */}
      <div className="p-3 border-t border-[#2B323D] bg-[#161A1F]">
        <div className="flex items-center justify-between px-2 py-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded bg-[#2D3540] flex items-center justify-center font-semibold text-xs text-[#E5E7EB] border border-[#3C4654]">
              {user.name ? user.name.slice(0, 2).toUpperCase() : "US"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate leading-tight">
                {user.name || "User"}
              </p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span
                  className={`inline-block px-1.5 py-0.2 text-[10px] font-semibold rounded leading-none ${
                    isManager
                      ? "bg-[#352512] text-[#E0A045] border border-[#593E1B]"
                      : "bg-[#1E2E25] text-[#4ADE80] border border-[#2D4A3A]"
                  }`}
                >
                  {user.role || "STAFF"}
                </span>
                <span className="text-[11px] text-[#6B7280] truncate">
                  {user.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-[#252C36] space-y-1.5 px-1">
          <div className="flex items-center justify-between">
            <Link
              href="/profile"
              className="text-xs text-[#9CA3AF] hover:text-white px-2 py-1 rounded transition-colors"
            >
              My Profile
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-[#B23A34] hover:text-[#EF4444] px-2 py-1 rounded transition-colors font-medium cursor-pointer"
            >
              Logout
            </button>
          </div>
          <div className="flex items-center justify-between px-2 pt-1 border-t border-[#232932] text-[11px] text-[#737C8A]">
            <Link
              href="/privacy"
              className="hover:text-[#CBD5E1] transition-colors"
            >
              Privacy Policy
            </Link>
            <span>&middot;</span>
            <Link
              href="/terms"
              className="hover:text-[#CBD5E1] transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
