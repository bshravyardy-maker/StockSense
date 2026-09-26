import { prisma } from "@/lib/prisma";
import { NewDeliveryModal } from "@/components/operations/NewDeliveryModal";
import { DeliveryOrderItem, DeliveriesTable } from "@/components/operations/DeliveriesTable";
import React from "react";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
  }>;
}

export default async function DeliveriesPage({ searchParams }: PageProps) {
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

  // Fetch stock levels for the stock-check feature in the modal
  const allStockLevels = await prisma.stockLevel.findMany({
    select: { productId: true, locationId: true, quantity: true, reserved: true },
  });
  // Build a map: `${productId}:${locationId}` -> freeToUse
  const stockMap: Record<string, number> = {};
  for (const sl of allStockLevels) {
    stockMap[`${sl.productId}:${sl.locationId}`] = sl.quantity - sl.reserved;
  }

  const products = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    unit: p.unit.abbreviation,
  }));

  // 2. Query delivery orders
  const rawDeliveries = await prisma.deliveryOrder.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter as any } : {}),
      ...(searchQuery
        ? {
            OR: [
              { reference: { contains: searchQuery, mode: "insensitive" } },
              { destinationAddress: { contains: searchQuery, mode: "insensitive" } },
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

  const deliveries: DeliveryOrderItem[] = rawDeliveries.map((d) => ({
    id: d.id,
    reference: d.reference,
    destinationAddress: d.destinationAddress,
    status: d.status,
    scheduleDate: d.scheduleDate,
    createdAt: d.createdAt,
    lines: d.lines.map((l) => {
      const loc = locationMap.get(l.sourceLocationId);
      const freeToUse = stockMap[`${l.productId}:${l.sourceLocationId}`] ?? 0;
      return {
        id: l.id,
        productName: l.product.name,
        productSku: l.product.sku,
        sourceLocationName: loc ? loc.name : "Warehouse Location",
        warehouseCode: loc ? loc.warehouse.shortCode : "WH",
        quantity: l.quantity,
        unitAbbr: l.product.unit.abbreviation,
        freeToUse,
      };
    }),
  }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 mb-6 border-b border-[var(--color-line)] gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-anthracite)] font-mono uppercase">
            Outbound Delivery Orders
          </h1>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            Manage dispatch orders, stock reservations, and outbound shipping validation.
          </p>
        </div>
        <NewDeliveryModal locations={locations} products={products} stockMap={stockMap} />
      </div>

      {searchQuery && (
        <div className="mb-4 px-3 py-2 bg-[#F8F9FA] border border-[var(--color-line)] rounded-md flex items-center justify-between text-xs">
          <span>
            Filtering delivery orders matching: <strong className="font-mono text-[var(--color-ink)]">"{searchQuery}"</strong>
          </span>
          <span className="text-[var(--color-muted)]">{deliveries.length} matching</span>
        </div>
      )}

      <DeliveriesTable deliveries={deliveries} />
    </div>
  );
}
