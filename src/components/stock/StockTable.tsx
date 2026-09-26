"use client";

import { updateStockLevelQuantity } from "@/app/actions/stock";
import React, { useState, useTransition } from "react";

export interface StockProductLocation {
  id?: string;
  locationId: string;
  locationName: string;
  warehouseName: string;
  warehouseCode: string;
  quantity: number;
  reserved: number;
}

export interface StockProductItem {
  id: string;
  name: string;
  sku: string;
  unitCost: number;
  unitAbbr: string;
  categoryName: string;
  totalOnHand: number;
  totalFreeToUse: number;
  locations: StockProductLocation[];
}

interface StockTableProps {
  products: StockProductItem[];
  allLocations: {
    id: string;
    name: string;
    warehouseName: string;
    warehouseCode: string;
  }[];
  searchQuery?: string;
}

export function StockTable({ products, allLocations, searchQuery }: StockTableProps) {
  // Map of `${productId}_${locationId}` -> editing quantity string
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ key: string; msg: string; isError?: boolean } | null>(null);

  // Expanded rows for inspecting/editing location details (default all expanded or toggleable)
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const p of products) {
      initial[p.id] = true; // default expand so users see location inline edits immediately
    }
    return initial;
  });

  const toggleExpand = (productId: string) => {
    setExpandedProductIds((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const startEdit = (productId: string, locationId: string, currentQty: number) => {
    setEditingKey(`${productId}_${locationId}`);
    setEditValue(currentQty.toString());
    setFeedback(null);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue("");
  };

  const handleSave = (productId: string, locationId: string) => {
    const qty = parseInt(editValue, 10);
    if (isNaN(qty) || qty < 0) {
      setFeedback({
        key: `${productId}_${locationId}`,
        msg: "Quantity must be 0 or greater.",
        isError: true,
      });
      return;
    }

    startTransition(async () => {
      const res = await updateStockLevelQuantity({
        productId,
        locationId,
        quantity: qty,
      });

      if (res?.error) {
        setFeedback({
          key: `${productId}_${locationId}`,
          msg: res.error,
          isError: true,
        });
      } else {
        setFeedback({
          key: `${productId}_${locationId}`,
          msg: "Updated",
          isError: false,
        });
        setEditingKey(null);
        setTimeout(() => setFeedback(null), 2500);
      }
    });
  };

  return (
    <div className="bg-white border border-[var(--color-line)] rounded-md shadow-2xs overflow-hidden">
      {products.length === 0 ? (
        <div className="py-16 text-center text-xs text-[var(--color-muted)]">
          <svg
            className="mx-auto h-10 w-10 text-gray-300 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="font-medium text-[var(--color-ink)] text-sm">No stock items found</p>
          <p className="mt-1">
            {searchQuery
              ? `No products match "${searchQuery}". Try a different keyword.`
              : "No products exist in the catalog yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[var(--color-line)] text-[var(--color-muted)] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 w-10"></th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4 text-right">Per-Unit Cost</th>
                <th className="py-3 px-4 text-right">On Hand</th>
                <th className="py-3 px-4 text-right">Free to Use</th>
                <th className="py-3 px-4">Location Overview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {products.map((item) => {
                const isExpanded = expandedProductIds[item.id];

                // Determine all available locations for this product (existing + unallocated)
                const existingLocationMap = new Map(
                  item.locations.map((l) => [l.locationId, l])
                );

                const productLocations: StockProductLocation[] = allLocations.map(
                  (loc) => {
                    const existing = existingLocationMap.get(loc.id);
                    if (existing) return existing;
                    return {
                      locationId: loc.id,
                      locationName: loc.name,
                      warehouseName: loc.warehouseName,
                      warehouseCode: loc.warehouseCode,
                      quantity: 0,
                      reserved: 0,
                    };
                  }
                );

                return (
                  <React.Fragment key={item.id}>
                    {/* Main Product Row */}
                    <tr
                      className={`hover:bg-[#F9FAF9] transition-colors cursor-pointer ${
                        isExpanded ? "bg-[#FAFBF9]" : ""
                      }`}
                      onClick={() => toggleExpand(item.id)}
                    >
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          className="text-[var(--color-muted)] hover:text-[var(--color-ink)] p-0.5"
                          title={isExpanded ? "Collapse" : "Expand"}
                        >
                          <svg
                            className={`w-3.5 h-3.5 transition-transform ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </td>

                      {/* Product Name */}
                      <td className="py-3 px-4 font-semibold text-[var(--color-ink)]">
                        <div>{item.name}</div>
                        <span className="text-[11px] text-[var(--color-muted)] font-normal">
                          {item.categoryName}
                        </span>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-mono font-medium text-[var(--color-ink)]">
                        {item.sku}
                      </td>

                      {/* Per-Unit Cost */}
                      <td className="py-3 px-4 text-right font-mono text-[var(--color-ink)]">
                        ${item.unitCost.toFixed(2)}
                      </td>

                      {/* On Hand */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-[var(--color-ink)] text-sm">
                        {item.totalOnHand} {item.unitAbbr}
                      </td>

                      {/* Free to Use */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#2E7D4F] text-sm">
                        {item.totalFreeToUse} {item.unitAbbr}
                      </td>

                      {/* Quick Location Badge Summary */}
                      <td className="py-3 px-4 text-[11px] text-[var(--color-muted)]">
                        {item.locations.length > 0 ? (
                          <span className="font-mono">
                            {item.locations.length}{" "}
                            {item.locations.length === 1 ? "location" : "locations"} active
                          </span>
                        ) : (
                          <span className="italic">No stock recorded</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Location Breakdown with Inline Editing */}
                    {isExpanded && (
                      <tr className="bg-[#F8F9FA]/80">
                        <td colSpan={7} className="py-3 px-8 border-t border-b border-[var(--color-line)]">
                          <div className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2 font-mono flex items-center justify-between">
                            <span>Locations & Stock Quantities (Click On Hand to edit directly)</span>
                            <span className="text-[10px] lowercase font-normal italic text-[var(--color-muted)]">
                              manual override, saves directly to StockLevel
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {productLocations.map((loc) => {
                              const key = `${item.id}_${loc.locationId}`;
                              const isEditing = editingKey === key;
                              const isLocPending = isPending && editingKey === key;
                              const currentFeedback = feedback?.key === key ? feedback : null;

                              return (
                                <div
                                  key={loc.locationId}
                                  className={`p-2.5 rounded border transition-colors ${
                                    loc.quantity > 0
                                      ? "bg-white border-[var(--color-line)]"
                                      : "bg-[#F4F4F2]/50 border-dashed border-[#DCDCD6]"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="font-medium text-[var(--color-ink)] text-xs">
                                      {loc.locationName}
                                    </span>
                                    <span className="text-[10px] font-mono text-[var(--color-muted)] bg-[#EDEDEA] px-1.5 py-0.5 rounded">
                                      {loc.warehouseCode}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between pt-1 border-t border-[#F0F0EC]">
                                    <div className="text-[11px]">
                                      <span className="text-[var(--color-muted)]">Reserved: </span>
                                      <span className="font-mono text-[var(--color-ink)]">
                                        {loc.reserved}
                                      </span>
                                    </div>

                                    {/* Inline Editable On Hand Value */}
                                    <div className="flex items-center space-x-1.5">
                                      <span className="text-[var(--color-muted)] text-[11px]">
                                        On Hand:
                                      </span>
                                      {isEditing ? (
                                        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                                          <input
                                            type="number"
                                            min="0"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") handleSave(item.id, loc.locationId);
                                              if (e.key === "Escape") cancelEdit();
                                            }}
                                            autoFocus
                                            className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold border border-[var(--color-amber)] rounded bg-white text-[var(--color-ink)] focus:outline-none"
                                          />
                                          <button
                                            type="button"
                                            disabled={isLocPending}
                                            onClick={() => handleSave(item.id, loc.locationId)}
                                            className="px-1.5 py-0.5 bg-[var(--color-green)] text-white text-[10px] font-semibold rounded hover:bg-[#256841] cursor-pointer"
                                            title="Save (Enter)"
                                          >
                                            {isLocPending ? "..." : "✓"}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={cancelEdit}
                                            className="px-1.5 py-0.5 bg-gray-200 text-gray-700 text-[10px] font-semibold rounded hover:bg-gray-300 cursor-pointer"
                                            title="Cancel (Esc)"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ) : (
                                        <div
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            startEdit(item.id, loc.locationId, loc.quantity);
                                          }}
                                          className="group inline-flex items-center space-x-1 px-2 py-0.5 rounded border border-transparent hover:border-[var(--color-amber)] hover:bg-[#FEF3D6] cursor-pointer transition-colors"
                                          title="Click to inline edit stock quantity"
                                        >
                                          <span className="font-mono font-bold text-xs text-[var(--color-ink)] group-hover:text-[#9A6214]">
                                            {loc.quantity}
                                          </span>
                                          <span className="text-[10px] text-[var(--color-muted)] font-mono">
                                            {item.unitAbbr}
                                          </span>
                                          <svg
                                            className="w-3 h-3 text-gray-400 group-hover:text-[var(--color-amber)] ml-0.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                            />
                                          </svg>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Error / Success Feedback */}
                                  {currentFeedback && (
                                    <div
                                      className={`mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                        currentFeedback.isError
                                          ? "bg-[#FCE8E6] text-[#B23A34]"
                                          : "bg-[#E6F4EA] text-[#2E7D4F]"
                                      }`}
                                    >
                                      {currentFeedback.msg}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
