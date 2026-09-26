"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState, useTransition } from "react";

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentQuery = searchParams.get("q") || "";
  const [searchValue, setSearchValue] = useState(currentQuery);

  useEffect(() => {
    setSearchValue(currentQuery);
  }, [currentQuery]);

  const handleSearch = (term: string) => {
    setSearchValue(term);
    const params = new URLSearchParams(searchParams.toString());
    if (term.trim()) {
      params.set("q", term.trim());
    } else {
      params.delete("q");
    }

    startTransition(() => {
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl);
    });
  };

  const handleClear = () => {
    handleSearch("");
  };

  return (
    <header className="h-16 bg-white border-b border-[var(--color-line)] px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Global Search Bar */}
      <div className="flex-1 max-w-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(searchValue);
          }}
          className="relative"
        >
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-muted)]">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Global search by product name or SKU..."
            className="w-full pl-9 pr-9 py-2 text-sm bg-[#F8F9FA] border border-[var(--color-line)] rounded-md text-[var(--color-ink)] placeholder-[var(--color-muted)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)] focus:border-[var(--color-amber)] transition-colors"
          />
          {searchValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--color-muted)] hover:text-[var(--color-ink)] cursor-pointer"
              title="Clear search"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </form>
      </div>

      {/* Right side operational indicators */}
      <div className="flex items-center space-x-4 pl-4 text-xs text-[var(--color-muted)]">
        {isPending && (
          <span className="flex items-center space-x-1.5 text-[var(--color-amber)] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-amber)] animate-pulse" />
            <span>Updating...</span>
          </span>
        )}
        <div className="flex items-center space-x-2 border-l border-[var(--color-line)] pl-4">
          <span className="w-2 h-2 rounded-full bg-[var(--color-green)]" />
          <span className="font-mono text-[11px] font-semibold text-[var(--color-ink)] tracking-wider">
            SYSTEM ACTIVE
          </span>
        </div>
      </div>
    </header>
  );
}
