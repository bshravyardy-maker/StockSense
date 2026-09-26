"use client";

import { createProduct, CreateProductState } from "@/app/actions/products";
import React, { useActionState, useEffect, useState } from "react";

interface CategoryOption {
  id: string;
  name: string;
}

interface UnitOption {
  id: string;
  name: string;
  abbreviation: string;
}

interface NewProductModalProps {
  categories: CategoryOption[];
  units: UnitOption[];
}

export function NewProductModal({ categories, units }: NewProductModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<CreateProductState | null, FormData>(
    createProduct,
    null
  );

  useEffect(() => {
    if (state?.success) {
      setIsOpen(false);
    }
  }, [state?.success]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    if (!isPending) {
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[var(--color-anthracite)] hover:bg-[#2B323D] border border-transparent rounded-md shadow-2xs transition-colors cursor-pointer"
      >
        <svg
          className="w-4 h-4 mr-1.5 text-[var(--color-amber)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        + New Product
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div
            className="bg-white border border-[var(--color-line)] rounded-md shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--color-line)] flex items-center justify-between bg-[#F8F9FA]">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-ink)] font-mono uppercase tracking-wide">
                  Create New Product
                </h3>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  Register a new inventory SKU into the catalog
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)] cursor-pointer text-lg leading-none p-1"
              >
                &times;
              </button>
            </div>

            {/* Form */}
            <form action={formAction} className="flex-1 overflow-y-auto p-6 space-y-4">
              {state?.error && (
                <div className="p-3 text-xs bg-[#FCE8E6] border border-[#F5C2BE] text-[#B23A34] rounded">
                  {state.error}
                </div>
              )}

              {/* Name & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Heavy Duty Steel Bar"
                    className="w-full text-xs px-3 py-2 border border-[var(--color-line)] rounded-md bg-[#FBFBFA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]"
                  />
                  {state?.fieldErrors?.name && (
                    <p className="mt-1 text-[11px] text-[#B23A34]">
                      {state.fieldErrors.name[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                    SKU (Unique) *
                  </label>
                  <input
                    type="text"
                    name="sku"
                    required
                    placeholder="e.g. STL-902"
                    className="w-full text-xs font-mono uppercase px-3 py-2 border border-[var(--color-line)] rounded-md bg-[#FBFBFA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]"
                  />
                  {state?.fieldErrors?.sku && (
                    <p className="mt-1 text-[11px] text-[#B23A34]">
                      {state.fieldErrors.sku[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Category & Unit of Measure */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                    Category *
                  </label>
                  <select
                    name="categoryId"
                    required
                    defaultValue=""
                    className="w-full text-xs px-3 py-2 border border-[var(--color-line)] rounded-md bg-[#FBFBFA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)] cursor-pointer"
                  >
                    <option value="" disabled>
                      Select category...
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {state?.fieldErrors?.categoryId && (
                    <p className="mt-1 text-[11px] text-[#B23A34]">
                      {state.fieldErrors.categoryId[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                    Unit of Measure *
                  </label>
                  <select
                    name="unitId"
                    required
                    defaultValue=""
                    className="w-full text-xs px-3 py-2 border border-[var(--color-line)] rounded-md bg-[#FBFBFA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)] cursor-pointer"
                  >
                    <option value="" disabled>
                      Select unit...
                    </option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.abbreviation})
                      </option>
                    ))}
                  </select>
                  {state?.fieldErrors?.unitId && (
                    <p className="mt-1 text-[11px] text-[#B23A34]">
                      {state.fieldErrors.unitId[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Unit Cost, Reorder Point, Reorder Qty */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                    Unit Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="unitCost"
                    defaultValue="0.00"
                    className="w-full text-xs font-mono px-3 py-2 border border-[var(--color-line)] rounded-md bg-[#FBFBFA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                    Reorder Point
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="reorderPoint"
                    defaultValue="10"
                    className="w-full text-xs font-mono px-3 py-2 border border-[var(--color-line)] rounded-md bg-[#FBFBFA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                    Reorder Qty
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="reorderQty"
                    defaultValue="50"
                    className="w-full text-xs font-mono px-3 py-2 border border-[var(--color-line)] rounded-md bg-[#FBFBFA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]"
                  />
                </div>
              </div>

              {/* Optional Description */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Material specs, grade, storage considerations..."
                  className="w-full text-xs px-3 py-2 border border-[var(--color-line)] rounded-md bg-[#FBFBFA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-[var(--color-line)] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
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
                  {isPending ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
