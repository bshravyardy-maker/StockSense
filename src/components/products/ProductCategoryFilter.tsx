"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useTransition } from "react";

interface CategoryOption {
  id: string;
  name: string;
}

export function ProductCategoryFilter({
  categories,
}: {
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const selectedCategory = searchParams.get("category") || "";

  const handleChange = (catId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (catId) {
      params.set("category", catId);
    } else {
      params.delete("category");
    }

    startTransition(() => {
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <label className="text-xs font-medium text-[var(--color-muted)]">
        Category:
      </label>
      <select
        value={selectedCategory}
        onChange={(e) => handleChange(e.target.value)}
        className="text-xs bg-white border border-[var(--color-line)] rounded-md px-2.5 py-1.5 text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)] cursor-pointer"
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {isPending && (
        <span className="text-[11px] text-[var(--color-amber)] animate-pulse">
          Filtering...
        </span>
      )}
    </div>
  );
}
