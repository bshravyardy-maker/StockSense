import { prisma } from "@/lib/prisma";
import { NewAdjustmentModal } from "@/components/operations/NewAdjustmentModal";
import { AdjustmentItem, AdjustmentsTable } from "@/components/operations/AdjustmentsTable";
import React from "react";

interface PageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function AdjustmentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const searchQuery = params.q || "";

  // 1. Fetch metadata for modal
  const [rawLocations, rawProducts] = await Promise.all([
    prisma.location.findMany({
      include: { warehouse: true },
      orderBy: [{ warehouse: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.product.findMany({
      include: { unit: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const locations = rawLocations.map((loc) => ({
    id: loc.id,
    name: loc.name,
    warehouseName: loc.warehouse.name,
    warehouseCode: loc.warehouse.shortCode,
  }));

  const products = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    unit: p.unit.abbreviation,
  }));

  // 2. Query adjustments
  const rawAdjustments = await prisma.adjustment.findMany({
    where: searchQuery
      ? {
          OR: [
            { reference: { contains: searchQuery, mode: "insensitive" } },
            { notes: { contains: searchQuery, mode: "insensitive" } },
            { lines: { some: { product: { name: { contains: searchQuery, mode: "insensitive" } } } } },
            { lines: { some: { product: { sku: { contains: searchQuery, mode: "insensitive" } } } } },
          ],
        }
      : {},
    include: {
      lines: {
        include: {
          product: {
            include: { unit: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const locationMap = new Map(rawLocations.map((l) => [l.id, l]));

  const adjustments: AdjustmentItem[] = rawAdjustments.map((a) => {
    const loc = locationMap.get(a.locationId);
    return {
      id: a.id,
      reference: a.reference,
      locationName: loc ? loc.name : "Location",
      warehouseCode: loc ? loc.warehouse.shortCode : "WH",
      notes: a.notes,
      createdAt: a.createdAt,
      lines: a.lines.map((l) => ({
        id: l.id,
        productName: l.product.name,
        productSku: l.product.sku,
        previousQty: l.previousQty,
        newQty: l.newQty,
        difference: l.newQty - l.previousQty,
        unitAbbr: l.product.unit.abbreviation,
      })),
    };
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 mb-6 border-b border-[var(--color-line)] gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-anthracite)] font-mono uppercase">
            Inventory Adjustments
          </h1>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            Log cycle counts, shrinkage corrections, and physical audit variations.
          </p>
        </div>
        <NewAdjustmentModal locations={locations} products={products} />
      </div>

      {searchQuery && (
        <div className="mb-4 px-3 py-2 bg-[#F8F9FA] border border-[var(--color-line)] rounded-md flex items-center justify-between text-xs">
          <span>
            Filtering adjustments matching: <strong className="font-mono text-[var(--color-ink)]">"{searchQuery}"</strong>
          </span>
          <span className="text-[var(--color-muted)]">{adjustments.length} matching</span>
        </div>
      )}

      <AdjustmentsTable adjustments={adjustments} />
    </div>
  );
}
