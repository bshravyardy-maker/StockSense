import { prisma } from "@/lib/prisma";
import { StockProductItem, StockTable } from "@/components/stock/StockTable";
import React from "react";

interface PageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function StockPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const searchQuery = params.q || "";

  // 1. Fetch all warehouse locations
  const rawLocations = await prisma.location.findMany({
    include: {
      warehouse: true,
    },
    orderBy: [{ warehouse: { name: "asc" } }, { name: "asc" }],
  });

  const allLocations = rawLocations.map((loc) => ({
    id: loc.id,
    name: loc.name,
    warehouseName: loc.warehouse.name,
    warehouseCode: loc.warehouse.shortCode,
  }));

  // 2. Fetch products with stock levels
  const rawProducts = await prisma.product.findMany({
    where: searchQuery
      ? {
          OR: [
            { name: { contains: searchQuery, mode: "insensitive" } },
            { sku: { contains: searchQuery, mode: "insensitive" } },
          ],
        }
      : {},
    include: {
      category: true,
      unit: true,
      stockLevels: {
        include: {
          location: {
            include: {
              warehouse: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // 3. Format product items for StockTable
  const products: StockProductItem[] = rawProducts.map((p) => {
    const totalOnHand = p.stockLevels.reduce((sum, sl) => sum + sl.quantity, 0);
    const totalReserved = p.stockLevels.reduce((sum, sl) => sum + sl.reserved, 0);
    const totalFreeToUse = Math.max(0, totalOnHand - totalReserved);

    const locations = p.stockLevels.map((sl) => ({
      id: sl.id,
      locationId: sl.locationId,
      locationName: sl.location.name,
      warehouseName: sl.location.warehouse.name,
      warehouseCode: sl.location.warehouse.shortCode,
      quantity: sl.quantity,
      reserved: sl.reserved,
    }));

    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      unitCost: p.unitCost,
      unitAbbr: p.unit.abbreviation,
      categoryName: p.category.name,
      totalOnHand,
      totalFreeToUse,
      locations,
    };
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 mb-6 border-b border-[var(--color-line)] gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-anthracite)] font-mono uppercase">
            Live Stock Snapshot
          </h1>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            On Hand vs Free to Use balances across all locations with direct quantity override.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono text-[var(--color-muted)]">
          <span className="w-2 h-2 rounded-full bg-[var(--color-green)]" />
          <span>Real-time DB connection</span>
        </div>
      </div>

      {/* Active Search Query Notice */}
      {searchQuery && (
        <div className="mb-4 px-3 py-2 bg-[#F8F9FA] border border-[var(--color-line)] rounded-md flex items-center justify-between text-xs">
          <span>
            Filtering by search query: <strong className="font-mono text-[var(--color-ink)]">"{searchQuery}"</strong>
          </span>
          <span className="text-[var(--color-muted)]">{products.length} matching products</span>
        </div>
      )}

      {/* Stock Table with Inline Editing */}
      <StockTable
        products={products}
        allLocations={allLocations}
        searchQuery={searchQuery}
      />
    </div>
  );
}
