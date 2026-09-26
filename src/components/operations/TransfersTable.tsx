"use client";

import { validateTransfer, cancelTransfer } from "@/app/actions/operations";
import React, { useTransition } from "react";

export interface TransferItem {
  id: string;
  reference: string;
  fromLocationName: string;
  fromWarehouseCode: string;
  toLocationName: string;
  toWarehouseCode: string;
  status: string;
  scheduledAt: Date | null;
  createdAt: Date;
  lines: Array<{
    id: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitAbbr: string;
  }>;
}

export function TransfersTable({ transfers }: { transfers: TransferItem[] }) {
  const [isPending, startTransition] = useTransition();

  const handleValidate = (id: string) => {
    if (confirm("Execute this internal transfer and move quantities between locations?")) {
      startTransition(async () => {
        const res = await validateTransfer(id);
        if (res?.error) alert(res.error);
      });
    }
  };

  const handleCancel = (id: string) => {
    if (confirm("Cancel this transfer?")) {
      startTransition(async () => {
        const res = await cancelTransfer(id);
        if (res?.error) alert(res.error);
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DONE":
        return "bg-[#E6F4EA] text-[#2E7D4F] border-[#A8DAB5]";
      case "DRAFT":
        return "bg-[#F1F3F4] text-[#5F6368] border-[#DADCE0]";
      case "CANCELLED":
        return "bg-[#FCE8E6] text-[#B23A34] border-[#F5C2BE]";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="bg-white border border-[var(--color-line)] rounded-md shadow-2xs overflow-hidden">
      {transfers.length === 0 ? (
        <div className="py-16 text-center text-xs text-[var(--color-muted)]">
          <p className="font-medium text-[var(--color-ink)] text-sm">No internal transfers scheduled</p>
          <p className="mt-1">Schedule a stock transfer between locations using the button above.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[var(--color-line)] text-[var(--color-muted)] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Source Location</th>
                <th className="py-3 px-4">Destination Location</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {transfers.map((t) => {
                const totalQty = t.lines.reduce((acc, l) => acc + l.quantity, 0);

                return (
                  <tr key={t.id} className="hover:bg-[#F9FAF9] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[var(--color-ink)]">
                      {t.reference}
                    </td>
                    <td className="py-3 px-4 text-[var(--color-ink)]">
                      <span>{t.fromLocationName}</span>
                      <span className="ml-1 text-[10px] font-mono text-[var(--color-muted)] bg-[#EDEDEA] px-1 py-0.5 rounded">
                        {t.fromWarehouseCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[var(--color-ink)]">
                      <span>{t.toLocationName}</span>
                      <span className="ml-1 text-[10px] font-mono text-[var(--color-muted)] bg-[#EDEDEA] px-1 py-0.5 rounded">
                        {t.toWarehouseCode}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[11px]">
                        <span className="font-semibold text-[var(--color-ink)] font-mono">
                          {totalQty} items
                        </span>
                        <div className="text-[10px] text-[var(--color-muted)] truncate max-w-xs mt-0.5">
                          {t.lines.map((l) => `${l.productName} (${l.quantity})`).join(", ")}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[var(--color-muted)] font-mono">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "2-digit",
                      }).format(new Date(t.createdAt))}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase border ${getStatusBadge(
                          t.status
                        )}`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {t.status === "DRAFT" && (
                        <>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleValidate(t.id)}
                            className="inline-flex items-center px-2 py-1 bg-[var(--color-green)] hover:bg-[#256841] text-white rounded text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                            title="Execute transfer"
                          >
                            Transfer
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleCancel(t.id)}
                            className="inline-flex items-center px-2 py-1 bg-gray-100 hover:bg-red-50 text-[#B23A34] rounded text-[11px] font-medium border border-gray-200 transition-colors cursor-pointer disabled:opacity-50"
                            title="Cancel transfer"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {t.status === "DONE" && (
                        <span className="text-[11px] font-medium text-[var(--color-green)] font-mono">
                          Transferred ✓
                        </span>
                      )}
                      {t.status === "CANCELLED" && (
                        <span className="text-[11px] font-medium text-[var(--color-muted)]">
                          Cancelled
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
