"use client";

import { createReceipt } from "@/app/actions/operations";
import React, { useState, useTransition } from "react";

interface SupplierOption {
  id: string;
  name: string;
}

interface LocationOption {
  id: string;
  name: string;
  warehouseName: string;
  warehouseCode: string;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  unit: string;
}

interface NewReceiptModalProps {
  suppliers: SupplierOption[];
  locations: LocationOption[];
  products: ProductOption[];
}

export function NewReceiptModal({ suppliers, locations, products }: NewReceiptModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [supplierId, setSupplierId] = useState("");
  const [destinationLocationId, setDestinationLocationId] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Array<{ productId: string; quantity: number }>>([
    { productId: products[0]?.id || "", quantity: 10 },
  ]);

  const addLine = () => {
    setLines([...lines, { productId: products[0]?.id || "", quantity: 10 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLineProduct = (index: number, productId: string) => {
    const updated = [...lines];
    updated[index].productId = productId;
    setLines(updated);
  };

  const updateLineQty = (index: number, quantity: number) => {
    const updated = [...lines];
    updated[index].quantity = quantity;
    setLines(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !destinationLocationId) {
      setError("Please select both a supplier and a destination location.");
      return;
    }

    startTransition(async () => {
      setError(null);
      const res = await createReceipt({
        supplierId,
        destinationLocationId,
        scheduleDate: scheduleDate || undefined,
        notes: notes || undefined,
        lines,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        setIsOpen(false);
        // Reset form
        setSupplierId("");
        setDestinationLocationId("");
        setScheduleDate("");
        setNotes("");
        setLines([{ productId: products[0]?.id || "", quantity: 10 }]);
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[var(--color-anthracite)] hover:bg-[#2B323D] rounded-md shadow-2xs transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4 mr-1.5 text-[var(--color-amber)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        + New Receipt
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white border border-[var(--color-line)] rounded-md shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--color-line)] flex items-center justify-between bg-[#F8F9FA]">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-ink)] font-mono uppercase tracking-wide">
                  Create Inbound Receipt
                </h3>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  Record expected supplier delivery and allocate to destination location
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)] text-lg leading-none cursor-pointer p-1"
              >
                &times;
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && (
                <div className="p-3 text-xs bg-[#FCE8E6] border border-[#F5C2BE] text-[#B23A34] rounded">
                  {error}
                </div>
              )}

              {/* Supplier & Destination Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                    Supplier *
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 border border-[var(--color-line)] rounded-md bg-[#FBFBFA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)] cursor-pointer"
                  >
                    <option value="" disabled>Select supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                    Destination Location *
                  </label>
                  <select
                    value={destinationLocationId}
                    onChange={(e) => setDestinationLocationId(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 border border-[var(--color-line)] rounded-md bg-[#FBFBFA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)] cursor-pointer"
                  >
                    <option value="" disabled>Select destination location...</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.warehouseName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Schedule Date & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-[var(--color-line)] rounded-md bg-[#FBFBFA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                    Notes / PO Ref
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Purchase order PO-883"
                    className="w-full text-xs px-3 py-2 border border-[var(--color-line)] rounded-md bg-[#FBFBFA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[var(--color-ink)] uppercase font-mono tracking-wider">
                    Receipt Items
                  </label>
                  <button
                    type="button"
                    onClick={addLine}
                    className="text-xs text-[var(--color-amber)] hover:text-[#8E5B10] font-semibold cursor-pointer"
                  >
                    + Add Product Line
                  </button>
                </div>

                <div className="space-y-2 border border-[var(--color-line)] rounded-md p-3 bg-[#FAFBF9]">
                  {lines.map((line, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <div className="flex-1">
                        <select
                          value={line.productId}
                          onChange={(e) => updateLineProduct(idx, e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 border border-[var(--color-line)] rounded bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => updateLineQty(idx, parseInt(e.target.value, 10) || 1)}
                          className="w-full text-xs font-mono px-2 py-1.5 border border-[var(--color-line)] rounded bg-white text-right focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]"
                        />
                      </div>

                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="text-[#B23A34] hover:text-[#DC2626] p-1 text-sm leading-none cursor-pointer"
                          title="Remove item"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-[var(--color-line)] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="px-3.5 py-2 text-xs font-medium text-[var(--color-ink)] hover:bg-[#F2F2F0] border border-[var(--color-line)] rounded-md transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[var(--color-amber)] hover:bg-[#A36718] rounded-md transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Creating..." : "Save Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
