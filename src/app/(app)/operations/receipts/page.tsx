import { prisma } from "@/lib/prisma";
import { NewReceiptModal } from "@/components/operations/NewReceiptModal";
import { ReceiptItem, ReceiptsTable } from "@/components/operations/ReceiptsTable";
import React from "react";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
  }>;
}

export default async function ReceiptsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status || "";
  const searchQuery = params.q || "";

  // 1. Fetch metadata for modal
  const [suppliers, rawLocations, rawProducts] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
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

  // 2. Query receipts
  const rawReceipts = await prisma.receipt.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter as any } : {}),
      ...(searchQuery
        ? {
            OR: [
              { reference: { contains: searchQuery, mode: "insensitive" } },
              { supplier: { name: { contains: searchQuery, mode: "insensitive" } } },
              { lines: { some: { product: { name: { contains: searchQuery, mode: "insensitive" } } } } },
              { lines: { some: { product: { sku: { contains: searchQuery, mode: "insensitive" } } } } },
            ],
          }
        : {}),
    },
    include: {
      supplier: true,
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

  // Map destination location name and warehouse
  const locationMap = new Map(rawLocations.map((l) => [l.id, l]));

  const receipts: ReceiptItem[] = rawReceipts.map((r) => {
    const loc = locationMap.get(r.destinationLocationId);
    return {
      id: r.id,
      reference: r.reference,
      supplierName: r.supplier.name,
      destinationLocationName: loc ? loc.name : "Warehouse Location",
      warehouseCode: loc ? loc.warehouse.shortCode : "WH",
      status: r.status,
      scheduleDate: r.scheduleDate,
      createdAt: r.createdAt,
      lines: r.lines.map((l) => ({
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
            Inbound Receipts
          </h1>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            Manage inbound supplier deliveries, line items, and stock intake validation.
          </p>
        </div>
        <NewReceiptModal
          suppliers={suppliers}
          locations={locations}
          products={products}
        />
      </div>

      {searchQuery && (
        <div className="mb-4 px-3 py-2 bg-[#F8F9FA] border border-[var(--color-line)] rounded-md flex items-center justify-between text-xs">
          <span>
            Filtering receipts matching: <strong className="font-mono text-[var(--color-ink)]">"{searchQuery}"</strong>
          </span>
          <span className="text-[var(--color-muted)]">{receipts.length} matching</span>
        </div>
      )}

      <ReceiptsTable receipts={receipts} />
    </div>
  );
}
