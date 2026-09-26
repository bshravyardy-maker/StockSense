"use client";

import { createWarehouse, createLocation } from "@/app/actions/settings";
import React, { useState, useTransition } from "react";

interface WarehouseOption {
  id: string;
  name: string;
  shortCode: string;
}

export function NewWarehouseModal({ warehouses }: { warehouses: WarehouseOption[] }) {
  const [isWhOpen, setIsWhOpen] = useState(false);
  const [isLocOpen, setIsLocOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // New warehouse state
  const [whName, setWhName] = useState("");
  const [whCode, setWhCode] = useState("");
  const [whAddress, setWhAddress] = useState("");

  // New location state
  const [selectedWhId, setSelectedWhId] = useState(warehouses[0]?.id || "");
  const [locName, setLocName] = useState("");
  const [locCode, setLocCode] = useState("");

  const handleCreateWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      setError(null);
      const res = await createWarehouse({
        name: whName,
        shortCode: whCode,
        address: whAddress || undefined,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        setIsWhOpen(false);
        setWhName("");
        setWhCode("");
        setWhAddress("");
      }
    });
  };

  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      setError(null);
      const res = await createLocation({
        warehouseId: selectedWhId,
        name: locName,
        shortCode: locCode,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        setIsLocOpen(false);
        setLocName("");
        setLocCode("");
      }
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => {
          setError(null);
          setIsLocOpen(true);
        }}
        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)] bg-white hover:bg-gray-50 border border-[var(--color-line)] rounded-md shadow-2xs transition-colors cursor-pointer"
      >
        + Add Location
      </button>

      <button
        onClick={() => {
          setError(null);
          setIsWhOpen(true);
        }}
        className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-[var(--color-anthracite)] hover:bg-[#2B323D] rounded-md shadow-2xs transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4 mr-1.5 text-[var(--color-amber)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        + New Warehouse
      </button>

      {/* New Warehouse Modal */}
      {isWhOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white border border-[var(--color-line)] rounded-md shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-line)] flex items-center justify-between bg-[#F8F9FA]">
              <h3 className="text-sm font-bold text-[var(--color-ink)] font-mono uppercase tracking-wide">
                Register Warehouse Facility
              </h3>
              <button
                type="button"
                onClick={() => setIsWhOpen(false)}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)] text-lg leading-none cursor-pointer p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateWarehouse} className="p-6 space-y-4">
              {error && (
                <div className="p-3 text-xs bg-[#FCE8E6] border border-[#F5C2BE] text-[#B23A34] rounded">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                  Warehouse Name *
                </label>
                <input
                  type="text"
                  required
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  placeholder="e.g. North Hub Logistics"
                  className="w-full text-xs px-3 py-2 border border-[var(--color-line)] rounded-md bg-[#FBFBFA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                  Short Code (Unique Prefix) *
                </label>
                <input
                  type="text"
                  required
                  value={whCode}
                  onChange={(e) => setWhCode(e.target.value.toUpperCase())}
                  placeholder="e.g. NH"
                  className="w-full text-xs font-mono uppercase px-3 py-2 border border-[var(--color-line)] rounded-md bg-[#FBFBFA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                  Physical Address
                </label>
                <input
                  type="text"
                  value={whAddress}
                  onChange={(e) => setWhAddress(e.target.value)}
                  placeholder="e.g. 500 Industrial Parkway, Zone 4"
                  className="w-full text-xs px-3 py-2 border border-[var(--color-line)] rounded-md bg-[#FBFBFA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]"
                />
              </div>

              <div className="pt-4 border-t border-[var(--color-line)] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsWhOpen(false)}
                  disabled={isPending}
                  className="px-3.5 py-2 text-xs font-medium text-[var(--color-ink)] hover:bg-[#F2F2F0] border border-[var(--color-line)] rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[var(--color-amber)] hover:bg-[#A36718] rounded-md transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Creating..." : "Save Warehouse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Location Modal */}
      {isLocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white border border-[var(--color-line)] rounded-md shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-line)] flex items-center justify-between bg-[#F8F9FA]">
              <h3 className="text-sm font-bold text-[var(--color-ink)] font-mono uppercase tracking-wide">
                Add Storage Location / Zone
              </h3>
              <button
                type="button"
                onClick={() => setIsLocOpen(false)}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)] text-lg leading-none cursor-pointer p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateLocation} className="p-6 space-y-4">
              {error && (
                <div className="p-3 text-xs bg-[#FCE8E6] border border-[#F5C2BE] text-[#B23A34] rounded">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                  Parent Warehouse *
                </label>
                <select
                  value={selectedWhId}
                  onChange={(e) => setSelectedWhId(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 border border-[var(--color-line)] rounded-md bg-[#FBFBFA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)] cursor-pointer"
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.shortCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                  Location Name *
                </label>
                <input
                  type="text"
                  required
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="e.g. Rack C or Bay 4"
                  className="w-full text-xs px-3 py-2 border border-[var(--color-line)] rounded-md bg-[#FBFBFA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1">
                  Location Code *
                </label>
                <input
                  type="text"
                  required
                  value={locCode}
                  onChange={(e) => setLocCode(e.target.value.toUpperCase())}
                  placeholder="e.g. STOCK3"
                  className="w-full text-xs font-mono uppercase px-3 py-2 border border-[var(--color-line)] rounded-md bg-[#FBFBFA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]"
                />
              </div>

              <div className="pt-4 border-t border-[var(--color-line)] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsLocOpen(false)}
                  disabled={isPending}
                  className="px-3.5 py-2 text-xs font-medium text-[var(--color-ink)] hover:bg-[#F2F2F0] border border-[var(--color-line)] rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[var(--color-amber)] hover:bg-[#A36718] rounded-md transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Adding..." : "Add Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
