"use client";

import {
  validateDelivery,
  cancelDelivery,
  markDeliveryWaiting,
  markDeliveryReady,
} from "@/app/actions/operations";
import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PrintDocumentModal, PrintableDocumentData } from "./PrintDocumentModal";

export interface DeliveryOrderItem {
  id: string;
  reference: string;
  destinationAddress: string | null;
  status: string;
  scheduleDate: Date | null;
  createdAt: Date;
  lines: Array<{
    id: string;
    productName: string;
    productSku: string;
    sourceLocationName: string;
    warehouseCode: string;
    quantity: number;
    unitAbbr: string;
    freeToUse: number; // on-hand minus reserved at source location
  }>;
}

const KANBAN_COLUMNS = ["DRAFT", "WAITING", "READY", "DONE", "CANCELLED"] as const;

function StatusBadgeClasses(status: string) {
  switch (status) {
    case "DONE":      return "bg-[#E6F4EA] text-[#2E7D4F] border-[#A8DAB5]";
    case "READY":     return "bg-[#FEF3D6] text-[#9A6214] border-[#F9DE96]";
    case "WAITING":   return "bg-[#E8F0FE] text-[#1967D2] border-[#AECBFA]";
    case "DRAFT":     return "bg-[#F1F3F4] text-[#5F6368] border-[#DADCE0]";
    case "CANCELLED": return "bg-[#FCE8E6] text-[#B23A34] border-[#F5C2BE]";
    default:          return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

function DeliveryActions({
  delivery,
  isPending,
  onWaiting,
  onReady,
  onValidate,
  onCancel,
  onPrint,
}: {
  delivery: DeliveryOrderItem;
  isPending: boolean;
  onWaiting: () => void;
  onReady: () => void;
  onValidate: () => void;
  onCancel: () => void;
  onPrint?: () => void;
}) {
  if (delivery.status === "DRAFT") {
    return (
      <>
        <button
          type="button"
          disabled={isPending}
          onClick={onWaiting}
          className="inline-flex items-center px-2 py-1 bg-[#1967D2] hover:bg-[#1558B0] text-white rounded text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
          title="Confirm order and reserve stock"
        >
          Confirm
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={onCancel}
          className="inline-flex items-center px-2 py-1 bg-gray-100 hover:bg-red-50 text-[#B23A34] rounded text-[11px] font-medium border border-gray-200 transition-colors cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
      </>
    );
  }
  if (delivery.status === "WAITING") {
    return (
      <>
        <button
          type="button"
          disabled={isPending}
          onClick={onReady}
          className="inline-flex items-center px-2 py-1 bg-[var(--color-amber)] hover:bg-[#A36718] text-white rounded text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
          title="Mark as Ready to ship"
        >
          Mark Ready
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={onCancel}
          className="inline-flex items-center px-2 py-1 bg-gray-100 hover:bg-red-50 text-[#B23A34] rounded text-[11px] font-medium border border-gray-200 transition-colors cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
      </>
    );
  }
  if (delivery.status === "READY") {
    return (
      <>
        <button
          type="button"
          disabled={isPending}
          onClick={onValidate}
          className="inline-flex items-center px-2 py-1 bg-[var(--color-green)] hover:bg-[#256841] text-white rounded text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
          title="Ship and close delivery order"
        >
          Ship / Done
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={onCancel}
          className="inline-flex items-center px-2 py-1 bg-gray-100 hover:bg-red-50 text-[#B23A34] rounded text-[11px] font-medium border border-gray-200 transition-colors cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
      </>
    );
  }
  if (delivery.status === "DONE") {
    return (
      <div className="inline-flex items-center space-x-2">
        <span className="text-[11px] font-medium text-[var(--color-green)] font-mono">Shipped ✓</span>
        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center px-2 py-0.5 bg-white hover:bg-[#F4F4F2] text-[var(--color-ink)] rounded text-[11px] font-medium border border-[var(--color-line)] shadow-2xs transition-colors cursor-pointer"
            title="Print delivery note"
          >
            <svg className="w-3 h-3 mr-1 text-[var(--color-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        )}
      </div>
    );
  }
  if (delivery.status === "CANCELLED") {
    return <span className="text-[11px] font-medium text-[var(--color-muted)]">Cancelled</span>;
  }
  return null;
}

export function DeliveriesTable({ deliveries }: { deliveries: DeliveryOrderItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [printingDoc, setPrintingDoc] = useState<PrintableDocumentData | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "table";

  const setView = (v: "table" | "kanban") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", v);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handlePrint = (d: DeliveryOrderItem) => {
    setPrintingDoc({
      type: "DELIVERY",
      reference: d.reference,
      status: d.status,
      date: d.createdAt,
      details: [
        { label: "Destination / Customer", value: d.destinationAddress || "Dispatch Dock" },
        { label: "Scheduled Date", value: d.scheduleDate ? new Date(d.scheduleDate).toLocaleDateString() : "Immediate" },
      ],
      lines: d.lines.map((l) => ({
        id: l.id,
        productName: l.productName,
        productSku: l.productSku,
        sourceLocation: `${l.sourceLocationName} (${l.warehouseCode})`,
        quantity: l.quantity,
        unitAbbr: l.unitAbbr,
      })),
    });
  };

  const handleWaiting = (id: string) => {
    if (confirm("Confirm this delivery order and reserve stock?")) {
      startTransition(async () => {
        const res = await markDeliveryWaiting(id);
        if (res?.error) alert(res.error);
      });
    }
  };
  const handleReady = (id: string) => {
    startTransition(async () => {
      const res = await markDeliveryReady(id);
      if (res?.error) alert(res.error);
    });
  };
  const handleValidate = (id: string) => {
    if (confirm("Ship this delivery order, decrement stock, and mark as Done?")) {
      startTransition(async () => {
        const res = await validateDelivery(id);
        if (res?.error) alert(res.error);
      });
    }
  };
  const handleCancel = (id: string) => {
    if (confirm("Cancel this delivery order and release any reserved stock?")) {
      startTransition(async () => {
        const res = await cancelDelivery(id);
        if (res?.error) alert(res.error);
      });
    }
  };

  // Check if any line exceeds available free-to-use stock
  const hasStockWarning = (d: DeliveryOrderItem) =>
    d.lines.some((l) => l.quantity > l.freeToUse && d.status !== "DONE" && d.status !== "CANCELLED");

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
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {KANBAN_COLUMNS.map((col) => {
            const colItems = deliveries.filter((d) => d.status === col);
            return (
              <div key={col} className="flex flex-col">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase border ${StatusBadgeClasses(col)}`}>
                    {col}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-muted)]">{colItems.length}</span>
                </div>
                <div className="flex flex-col space-y-2 min-h-24">
                  {colItems.length === 0 ? (
                    <div className="flex-1 border border-dashed border-[var(--color-line)] rounded-md flex items-center justify-center py-6">
                      <span className="text-[10px] text-[var(--color-muted)]">No items</span>
                    </div>
                  ) : (
                    colItems.map((d) => {
                      const totalQty = d.lines.reduce((acc, l) => acc + l.quantity, 0);
                      const warn = hasStockWarning(d);
                      return (
                        <div key={d.id} className={`bg-white border rounded-md p-3 shadow-2xs ${warn ? "border-[var(--color-red)]" : "border-[var(--color-line)]"}`}>
                          <div className="font-mono font-bold text-[11px] text-[var(--color-ink)] mb-1">{d.reference}</div>
                          <div className="text-[11px] font-medium text-[var(--color-ink)] truncate">{d.destinationAddress || "Client"}</div>
                          <div className="text-[10px] font-mono text-[var(--color-muted)] mt-1">{totalQty} items</div>
                          {warn && (
                            <div className="mt-1 text-[10px] text-[var(--color-red)] font-semibold">Stock insufficient</div>
                          )}
                          <div className="mt-2 flex flex-wrap gap-1">
                            <DeliveryActions
                              delivery={d}
                              isPending={isPending}
                              onWaiting={() => handleWaiting(d.id)}
                              onReady={() => handleReady(d.id)}
                              onValidate={() => handleValidate(d.id)}
                              onCancel={() => handleCancel(d.id)}
                              onPrint={() => handlePrint(d)}
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
          {deliveries.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--color-muted)]">
              <p className="font-medium text-[var(--color-ink)] text-sm">No delivery orders found</p>
              <p className="mt-1">Create an outbound delivery using the button above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FA] border-b border-[var(--color-line)] text-[var(--color-muted)] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Source Locations &amp; Items</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-line)]">
                  {deliveries.map((d) => {
                    const totalQty = d.lines.reduce((acc, l) => acc + l.quantity, 0);
                    const warn = hasStockWarning(d);
                    return (
                      <tr key={d.id} className={`transition-colors ${warn ? "bg-[#FFF5F5] hover:bg-[#FEE]" : "hover:bg-[#F9FAF9]"}`}>
                        <td className="py-3 px-4 font-mono font-bold text-[var(--color-ink)]">{d.reference}</td>
                        <td className="py-3 px-4 font-medium text-[var(--color-ink)] max-w-xs truncate">
                          {d.destinationAddress || "Client Destination"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-[11px]">
                            <span className="font-semibold text-[var(--color-ink)] font-mono">{totalQty} items</span>
                            <div className="text-[10px] text-[var(--color-muted)] truncate max-w-sm mt-0.5">
                              {d.lines.map((l) => `${l.productName} (${l.quantity} from ${l.sourceLocationName})`).join(", ")}
                            </div>
                            {warn && (
                              <div className="text-[10px] text-[var(--color-red)] font-semibold mt-0.5">
                                {d.lines
                                  .filter((l) => l.quantity > l.freeToUse)
                                  .map((l) => `${l.productName}: need ${l.quantity}, free ${l.freeToUse}`)
                                  .join("; ")}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[var(--color-muted)] font-mono">
                          {new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" }).format(new Date(d.createdAt))}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase border ${StatusBadgeClasses(d.status)}`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <DeliveryActions
                            delivery={d}
                            isPending={isPending}
                            onWaiting={() => handleWaiting(d.id)}
                            onReady={() => handleReady(d.id)}
                            onValidate={() => handleValidate(d.id)}
                            onCancel={() => handleCancel(d.id)}
                            onPrint={() => handlePrint(d)}
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

      {/* Printable Document Modal */}
      <PrintDocumentModal
        document={printingDoc}
        onClose={() => setPrintingDoc(null)}
      />
    </div>
  );
}
