"use client";

import {
  validateReceipt,
  cancelReceipt,
  markReceiptReady,
} from "@/app/actions/operations";
import React, { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export interface ReceiptItem {
  id: string;
  reference: string;
  supplierName: string;
  destinationLocationName: string;
  warehouseCode: string;
  status: string;
  scheduleDate: Date | null;
  createdAt: Date;
  lines: Array<{
    id: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitAbbr: string;
  }>;
}

// Status display order for Kanban columns
const KANBAN_COLUMNS = ["DRAFT", "READY", "DONE", "CANCELLED"] as const;

function StatusBadgeClasses(status: string) {
  switch (status) {
    case "DONE":       return "bg-[#E6F4EA] text-[#2E7D4F] border-[#A8DAB5]";
    case "READY":      return "bg-[#FEF3D6] text-[#9A6214] border-[#F9DE96]";
    case "DRAFT":      return "bg-[#F1F3F4] text-[#5F6368] border-[#DADCE0]";
    case "CANCELLED":  return "bg-[#FCE8E6] text-[#B23A34] border-[#F5C2BE]";
    default:           return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

function ReceiptActions({
  receipt,
  isPending,
  onMarkReady,
  onValidate,
  onCancel,
}: {
  receipt: ReceiptItem;
  isPending: boolean;
  onMarkReady: () => void;
  onValidate: () => void;
  onCancel: () => void;
}) {
  if (receipt.status === "DRAFT") {
    return (
      <>
        <button
          type="button"
          disabled={isPending}
          onClick={onMarkReady}
          className="inline-flex items-center px-2 py-1 bg-[var(--color-amber)] hover:bg-[#A36718] text-white rounded text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
          title="Confirm receipt is ready to receive"
        >
          Mark Ready
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={onCancel}
          className="inline-flex items-center px-2 py-1 bg-gray-100 hover:bg-red-50 text-[#B23A34] rounded text-[11px] font-medium border border-gray-200 transition-colors cursor-pointer disabled:opacity-50"
          title="Cancel receipt"
        >
          Cancel
        </button>
      </>
    );
  }
  if (receipt.status === "READY") {
    return (
      <>
        <button
          type="button"
          disabled={isPending}
          onClick={onValidate}
          className="inline-flex items-center px-2 py-1 bg-[var(--color-green)] hover:bg-[#256841] text-white rounded text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
          title="Validate receipt and add to stock"
        >
          Validate
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={onCancel}
          className="inline-flex items-center px-2 py-1 bg-gray-100 hover:bg-red-50 text-[#B23A34] rounded text-[11px] font-medium border border-gray-200 transition-colors cursor-pointer disabled:opacity-50"
          title="Cancel receipt"
        >
          Cancel
        </button>
      </>
    );
  }
  if (receipt.status === "DONE") {
    return <span className="text-[11px] font-medium text-[var(--color-green)] font-mono">Received ✓</span>;
  }
  if (receipt.status === "CANCELLED") {
    return <span className="text-[11px] font-medium text-[var(--color-muted)]">Cancelled</span>;
  }
  return null;
}

export function ReceiptsTable({ receipts }: { receipts: ReceiptItem[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "table";

  const setView = (v: "table" | "kanban") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", v);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleMarkReady = (id: string) => {
    if (confirm("Mark this receipt as Ready to receive?")) {
      startTransition(async () => { await markReceiptReady(id); });
    }
  };
  const handleValidate = (id: string) => {
    if (confirm("Validate this receipt and increase stock in destination location?")) {
      startTransition(async () => { await validateReceipt(id); });
    }
  };
  const handleCancel = (id: string) => {
    if (confirm("Cancel this receipt?")) {
      startTransition(async () => { await cancelReceipt(id); });
    }
  };

  return (
    <div>
      {/* View toggle */}
      <div className="flex items-center justify-end mb-3 space-x-1">
        <button
          onClick={() => setView("table")}
          title="Table view"
          className={`p-1.5 rounded border transition-colors cursor-pointer ${
            view === "table"
              ? "bg-[var(--color-anthracite)] text-white border-[var(--color-anthracite)]"
              : "bg-white text-[var(--color-muted)] border-[var(--color-line)] hover:border-[var(--color-anthracite)]"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 4v16" />
          </svg>
        </button>
        <button
          onClick={() => setView("kanban")}
          title="Kanban view"
          className={`p-1.5 rounded border transition-colors cursor-pointer ${
            view === "kanban"
              ? "bg-[var(--color-anthracite)] text-white border-[var(--color-anthracite)]"
              : "bg-white text-[var(--color-muted)] border-[var(--color-line)] hover:border-[var(--color-anthracite)]"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        </button>
      </div>

      {view === "kanban" ? (
        /* ---- KANBAN VIEW ---- */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KANBAN_COLUMNS.map((col) => {
            const colReceipts = receipts.filter((r) => r.status === col);
            return (
              <div key={col} className="flex flex-col">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase border ${StatusBadgeClasses(col)}`}>
                    {col}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-muted)]">{colReceipts.length}</span>
                </div>
                <div className="flex flex-col space-y-2 min-h-24">
                  {colReceipts.length === 0 ? (
                    <div className="flex-1 border border-dashed border-[var(--color-line)] rounded-md flex items-center justify-center py-6">
                      <span className="text-[10px] text-[var(--color-muted)]">No items</span>
                    </div>
                  ) : (
                    colReceipts.map((r) => {
                      const totalQty = r.lines.reduce((acc, l) => acc + l.quantity, 0);
                      return (
                        <div
                          key={r.id}
                          className="bg-white border border-[var(--color-line)] rounded-md p-3 shadow-2xs"
                        >
                          <div className="font-mono font-bold text-[11px] text-[var(--color-ink)] mb-1">{r.reference}</div>
                          <div className="text-[11px] font-medium text-[var(--color-ink)] truncate">{r.supplierName}</div>
                          <div className="text-[10px] text-[var(--color-muted)] mt-0.5 truncate">{r.destinationLocationName}</div>
                          <div className="text-[10px] font-mono text-[var(--color-muted)] mt-1">{totalQty} items</div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            <ReceiptActions
                              receipt={r}
                              isPending={isPending}
                              onMarkReady={() => handleMarkReady(r.id)}
                              onValidate={() => handleValidate(r.id)}
                              onCancel={() => handleCancel(r.id)}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ---- TABLE VIEW ---- */
        <div className="bg-white border border-[var(--color-line)] rounded-md shadow-2xs overflow-hidden">
          {receipts.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--color-muted)]">
              <p className="font-medium text-[var(--color-ink)] text-sm">No receipts found</p>
              <p className="mt-1">Create an inbound receipt using the button above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FA] border-b border-[var(--color-line)] text-[var(--color-muted)] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Destination Location</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-line)]">
                  {receipts.map((r) => {
                    const totalQty = r.lines.reduce((acc, l) => acc + l.quantity, 0);
                    return (
                      <tr key={r.id} className="hover:bg-[#F9FAF9] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[var(--color-ink)]">{r.reference}</td>
                        <td className="py-3 px-4 font-medium text-[var(--color-ink)]">{r.supplierName}</td>
                        <td className="py-3 px-4 text-[var(--color-ink)]">
                          <span>{r.destinationLocationName}</span>
                          <span className="ml-1 text-[10px] font-mono text-[var(--color-muted)] bg-[#EDEDEA] px-1 py-0.5 rounded">
                            {r.warehouseCode}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-[11px]">
                            <span className="font-semibold text-[var(--color-ink)] font-mono">{totalQty} items</span>
                            <div className="text-[10px] text-[var(--color-muted)] truncate max-w-xs mt-0.5">
                              {r.lines.map((l) => `${l.productName} (${l.quantity})`).join(", ")}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[var(--color-muted)] font-mono">
                          {new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" }).format(new Date(r.createdAt))}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase border ${StatusBadgeClasses(r.status)}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <ReceiptActions
                            receipt={r}
                            isPending={isPending}
                            onMarkReady={() => handleMarkReady(r.id)}
                            onValidate={() => handleValidate(r.id)}
                            onCancel={() => handleCancel(r.id)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
