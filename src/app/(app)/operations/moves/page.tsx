import { prisma } from "@/lib/prisma";
import Link from "next/link";
import React from "react";

interface PageProps {
  searchParams: Promise<{
    type?: string;
    q?: string;
  }>;
}

export default async function MoveHistoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const typeFilter = params.type || "";
  const searchQuery = params.q || "";

  // 1. Fetch locations for mapping
  const rawLocations = await prisma.location.findMany({
    include: { warehouse: true },
  });
  const locationMap = new Map(rawLocations.map((l) => [l.id, l]));

  // 2. Query stock ledger
  const ledgerEntries = await prisma.stockLedger.findMany({
    where: {
      ...(typeFilter ? { documentType: typeFilter as any } : {}),
      ...(searchQuery
        ? {
            OR: [
              { documentRef: { contains: searchQuery, mode: "insensitive" } },
              { notes: { contains: searchQuery, mode: "insensitive" } },
              { product: { name: { contains: searchQuery, mode: "insensitive" } } },
              { product: { sku: { contains: searchQuery, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      product: {
        include: { unit: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100, // Show last 100 movements
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "RECEIPT":
        return "bg-[#E6F4EA] text-[#2E7D4F]";
      case "DELIVERY":
        return "bg-[#E8F0FE] text-[#1967D2]";
      case "TRANSFER":
        return "bg-[#F3E8FD] text-[#6B21A8]";
      case "ADJUSTMENT":
        return "bg-[#FEF3D6] text-[#92400E]";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const types = ["ALL", "RECEIPT", "DELIVERY", "TRANSFER", "ADJUSTMENT"];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 mb-6 border-b border-[var(--color-line)] gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-anthracite)] font-mono uppercase">
            Stock Move History
          </h1>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            Immutable StockLedger audit trail of all receipts, deliveries, transfers, and count corrections.
          </p>
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center space-x-1.5 bg-[#EAEAE6] p-1 rounded-md">
          {types.map((t) => {
            const isSelected = (!typeFilter && t === "ALL") || typeFilter === t;
            const href = t === "ALL" ? "/operations/moves" : `/operations/moves?type=${t}`;
            return (
              <Link
                key={t}
                href={href}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
                  isSelected
                    ? "bg-white text-[var(--color-ink)] shadow-2xs"
                    : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                }`}
              >
                {t}
              </Link>
            );
          })}
        </div>
      </div>

      {searchQuery && (
        <div className="mb-4 px-3 py-2 bg-[#F8F9FA] border border-[var(--color-line)] rounded-md flex items-center justify-between text-xs">
          <span>
            Filtering ledger movements matching: <strong className="font-mono text-[var(--color-ink)]">"{searchQuery}"</strong>
          </span>
          <span className="text-[var(--color-muted)]">{ledgerEntries.length} entries</span>
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-white border border-[var(--color-line)] rounded-md shadow-2xs overflow-hidden">
        {ledgerEntries.length === 0 ? (
          <div className="py-16 text-center text-xs text-[var(--color-muted)]">
            <svg className="mx-auto h-10 w-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium text-[var(--color-ink)] text-sm">No ledger entries recorded yet</p>
            <p className="mt-1">
              Stock movements will be logged automatically here whenever receipts, deliveries, transfers, or adjustments are completed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[var(--color-line)] text-[var(--color-muted)] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Document Ref</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Quantity Change</th>
                  <th className="py-3 px-4 text-right">Balance After</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {ledgerEntries.map((entry) => {
                  const loc = locationMap.get(entry.locationId);
                  const isPositive = entry.quantityChange > 0;
                  const isNegative = entry.quantityChange < 0;

                  return (
                    <tr key={entry.id} className="hover:bg-[#F9FAF9] transition-colors">
                      <td className="py-3 px-4 font-mono text-[var(--color-muted)] whitespace-nowrap">
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        }).format(new Date(entry.createdAt))}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase ${getTypeBadge(
                            entry.documentType
                          )}`}
                        >
                          {entry.documentType}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-[var(--color-ink)] whitespace-nowrap">
                        {entry.documentRef}
                      </td>

                      <td className="py-3 px-4 font-semibold text-[var(--color-ink)]">
                        <div>{entry.product.name}</div>
                        <div className="text-[10px] text-[var(--color-muted)] font-mono font-normal">
                          {entry.product.sku}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[var(--color-ink)] whitespace-nowrap">
                        <span>{loc?.name || "Location"}</span>
                        <span className="ml-1 text-[10px] font-mono text-[var(--color-muted)] bg-[#EDEDEA] px-1 py-0.5 rounded">
                          {loc?.warehouse.shortCode || "WH"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-sm whitespace-nowrap">
                        <span
                          className={
                            isPositive
                              ? "text-[var(--color-green)]"
                              : isNegative
                              ? "text-[var(--color-red)]"
                              : "text-gray-500"
                          }
                        >
                          {isPositive ? `+${entry.quantityChange}` : entry.quantityChange}{" "}
                          <span className="text-[10px] font-normal text-[var(--color-muted)]">
                            {entry.product.unit.abbreviation}
                          </span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-semibold text-[var(--color-ink)] whitespace-nowrap">
                        {entry.balanceAfter}{" "}
                        <span className="text-[10px] font-normal text-[var(--color-muted)]">
                          {entry.product.unit.abbreviation}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[var(--color-muted)] text-[11px] max-w-xs truncate">
                        {entry.notes || "None"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
