"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useTransition } from "react";

interface FilterOption {
  id: string;
  name: string;
}

interface DashboardFilterBarProps {
  warehouses: FilterOption[];
  categories: FilterOption[];
}

export function DashboardFilterBar({
  warehouses,
  categories,
}: DashboardFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const selectedDocType = searchParams.get("docType") || "";
  const selectedStatus = searchParams.get("status") || "";
  const selectedWarehouse = searchParams.get("warehouse") || "";
  const selectedCategory = searchParams.get("category") || "";

  const hasActiveFilters = Boolean(
    selectedDocType || selectedStatus || selectedWarehouse || selectedCategory
  );

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    startTransition(() => {
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    });
  };

  const handleReset = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("docType");
    params.delete("status");
    params.delete("warehouse");
    params.delete("category");

    startTransition(() => {
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    });
  };

  return (
    <div className="bg-white border border-[var(--color-line)] rounded-md p-4 mb-6 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 border-b border-[var(--color-line)] pb-2.5">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-[var(--color-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)] font-mono">
            Dashboard Filters
          </span>
          {isPending && (
            <span className="text-xs text-[var(--color-amber)] animate-pulse">Filtering...</span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)] font-medium cursor-pointer self-start sm:self-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Document Type Dropdown */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
            Document Type
          </label>
          <select
            value={selectedDocType}
            onChange={(e) => updateFilter("docType", e.target.value)}
            className="w-full text-xs bg-[#F8F9FA] border border-[var(--color-line)] rounded-md px-2.5 py-1.5 text-[var(--color-ink)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)] focus:border-[var(--color-amber)] cursor-pointer"
          >
            <option value="">All Document Types</option>
            <option value="RECEIPT">Receipt</option>
            <option value="DELIVERY">Delivery Order</option>
            <option value="TRANSFER">Internal Transfer</option>
            <option value="ADJUSTMENT">Inventory Adjustment</option>
          </select>
        </div>

        {/* Status Dropdown */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
            Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="w-full text-xs bg-[#F8F9FA] border border-[var(--color-line)] rounded-md px-2.5 py-1.5 text-[var(--color-ink)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)] focus:border-[var(--color-amber)] cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="WAITING">Waiting</option>
            <option value="READY">Ready</option>
            <option value="DONE">Done</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Warehouse Dropdown */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
            Warehouse
          </label>
          <select
            value={selectedWarehouse}
            onChange={(e) => updateFilter("warehouse", e.target.value)}
            className="w-full text-xs bg-[#F8F9FA] border border-[var(--color-line)] rounded-md px-2.5 py-1.5 text-[var(--color-ink)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)] focus:border-[var(--color-amber)] cursor-pointer"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Dropdown */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
            Product Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => updateFilter("category", e.target.value)}
            className="w-full text-xs bg-[#F8F9FA] border border-[var(--color-line)] rounded-md px-2.5 py-1.5 text-[var(--color-ink)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)] focus:border-[var(--color-amber)] cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
