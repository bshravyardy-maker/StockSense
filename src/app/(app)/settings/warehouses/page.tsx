import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NewWarehouseModal } from "@/components/settings/NewWarehouseModal";
import { redirect } from "next/navigation";
import React from "react";

export default async function WarehousesPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (role !== "MANAGER") {
    redirect("/dashboard");
  }

  const warehouses = await prisma.warehouse.findMany({
    include: {
      locations: {
        include: {
          stockLevels: true,
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const warehouseOptions = warehouses.map((w) => ({
    id: w.id,
    name: w.name,
    shortCode: w.shortCode,
  }));

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 mb-6 border-b border-[var(--color-line)] gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-anthracite)] font-mono uppercase">
            Warehouse Facilities & Locations
          </h1>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            Configure storage facilities, operational short codes, and internal storage zones.
          </p>
        </div>
        <NewWarehouseModal warehouses={warehouseOptions} />
      </div>

      {/* Warehouse Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {warehouses.map((wh) => (
          <div
            key={wh.id}
            className="bg-white border border-[var(--color-line)] rounded-md shadow-2xs overflow-hidden flex flex-col justify-between"
          >
            {/* Card Header */}
            <div className="p-5 border-b border-[var(--color-line)] bg-[#F8F9FA] flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-[var(--color-ink)]">
                    {wh.name}
                  </h2>
                  <span className="font-mono text-xs font-bold text-[var(--color-amber)] bg-[#FEF3D6] px-2 py-0.5 rounded border border-[#F9DE96]">
                    {wh.shortCode}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  {wh.address || "No physical address specified"}
                </p>
              </div>
              <span className="text-xs font-mono font-medium text-[var(--color-muted)] bg-white px-2 py-1 rounded border border-[var(--color-line)]">
                {wh.locations.length} {wh.locations.length === 1 ? "zone" : "zones"}
              </span>
            </div>

            {/* Locations List */}
            <div className="p-5 flex-1">
              <h3 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider font-mono mb-3">
                Assigned Storage Locations
              </h3>

              {wh.locations.length === 0 ? (
                <div className="text-xs text-[var(--color-muted)] italic py-4 text-center bg-[#FAFBF9] rounded border border-dashed border-[#DCDCD6]">
                  No locations defined in this facility. Click "+ Add Location" above to create one.
                </div>
              ) : (
                <div className="space-y-2">
                  {wh.locations.map((loc) => {
                    const activeProductsCount = loc.stockLevels.filter((sl) => sl.quantity > 0).length;
                    return (
                      <div
                        key={loc.id}
                        className="flex items-center justify-between p-2.5 rounded bg-[#FAFBF9] border border-[var(--color-line)] text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-[var(--color-green)]" />
                          <span className="font-medium text-[var(--color-ink)]">
                            {loc.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-mono text-[11px] text-[var(--color-muted)]">
                            Code: <strong className="text-[var(--color-ink)]">{loc.shortCode}</strong>
                          </span>
                          <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-[#DCDCD6] text-[var(--color-muted)]">
                            {activeProductsCount} active SKUs
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-[var(--color-line)] bg-[#FAFBF9] flex items-center justify-between text-[11px] text-[var(--color-muted)]">
              <span>Facility Status: Operational</span>
              <span className="font-mono">Created {new Date(wh.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
