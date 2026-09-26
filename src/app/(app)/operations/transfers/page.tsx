import { prisma } from "@/lib/prisma";
import { NewTransferModal } from "@/components/operations/NewTransferModal";
import { TransferItem, TransfersTable } from "@/components/operations/TransfersTable";
import React from "react";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
  }>;
}

export default async function TransfersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status || "";
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

  // 2. Query transfers
  const rawTransfers = await prisma.transfer.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter as any } : {}),
      ...(searchQuery
        ? {
            OR: [
              { reference: { contains: searchQuery, mode: "insensitive" } },
              { lines: { some: { product: { name: { contains: searchQuery, mode: "insensitive" } } } } },
              { lines: { some: { product: { sku: { contains: searchQuery, mode: "insensitive" } } } } },
            ],
          }
        : {}),
    },
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

  const transfers: TransferItem[] = rawTransfers.map((t) => {
    const fromLoc = locationMap.get(t.fromLocationId);
    const toLoc = locationMap.get(t.toLocationId);

    return {
      id: t.id,
      reference: t.reference,
      fromLocationName: fromLoc ? fromLoc.name : "Location",
      fromWarehouseCode: fromLoc ? fromLoc.warehouse.shortCode : "WH",
      toLocationName: toLoc ? toLoc.name : "Location",
      toWarehouseCode: toLoc ? toLoc.warehouse.shortCode : "WH",
      status: t.status,
      scheduledAt: t.scheduledAt,
      createdAt: t.createdAt,
      lines: t.lines.map((l) => ({
        id: l.id,
        productName: l.product.name,
        productSku: l.product.sku,
        quantity: l.quantity,
        unitAbbr: l.product.unit.abbreviation,
      })),
    };
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 mb-6 border-b border-[var(--color-line)] gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-anthracite)] font-mono uppercase">
            Internal Transfers
          </h1>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            Relocate stock across warehouse zones, racks, and production stages.
          </p>
        </div>
        <NewTransferModal locations={locations} products={products} />
      </div>

      {searchQuery && (
        <div className="mb-4 px-3 py-2 bg-[#F8F9FA] border border-[var(--color-line)] rounded-md flex items-center justify-between text-xs">
          <span>
            Filtering transfers matching: <strong className="font-mono text-[var(--color-ink)]">"{searchQuery}"</strong>
          </span>
          <span className="text-[var(--color-muted)]">{transfers.length} matching</span>
        </div>
      )}

      <TransfersTable transfers={transfers} />
    </div>
  );
}
