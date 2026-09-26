import { prisma } from "@/lib/prisma";
import { DashboardFilterBar } from "@/components/dashboard/DashboardFilterBar";
import { KPICards } from "@/components/dashboard/KPICards";
import {
  ReorderAssistant,
  ReorderFlaggedProduct,
} from "@/components/dashboard/ReorderAssistant";
import {
  RecentDocumentsTable,
  DashboardDocument,
} from "@/components/dashboard/RecentDocumentsTable";
import React from "react";

interface PageProps {
  searchParams: Promise<{
    docType?: string;
    status?: string;
    warehouse?: string;
    category?: string;
    q?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const docTypeFilter = params.docType || "";
  const statusFilter = params.status || "";
  const warehouseFilter = params.warehouse || "";
  const categoryFilter = params.category || "";
  const searchQuery = params.q || "";

  // 1. Fetch metadata for filters
  const [warehouses, categories] = await Promise.all([
    prisma.warehouse.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  // If warehouse filter is specified, fetch location IDs for that warehouse
  let warehouseLocationIds: string[] | undefined = undefined;
  if (warehouseFilter) {
    const locs = await prisma.location.findMany({
      where: { warehouseId: warehouseFilter },
      select: { id: true },
    });
    warehouseLocationIds = locs.map((l) => l.id);
  }

  // 2. Fetch products and stock levels
  const products = await prisma.product.findMany({
    where: {
      ...(categoryFilter ? { categoryId: categoryFilter } : {}),
      ...(searchQuery
        ? {
            OR: [
              { name: { contains: searchQuery, mode: "insensitive" } },
              { sku: { contains: searchQuery, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      category: true,
      unit: true,
      stockLevels: {
        where: warehouseLocationIds
          ? { locationId: { in: warehouseLocationIds } }
          : {},
      },
    },
  });

  // KPI 1: Total products with at least one stock level row where quantity > 0
  const totalInStock = products.filter((p) =>
    p.stockLevels.some((sl) => sl.quantity > 0)
  ).length;

  // KPI 2: Products where total quantity across locations <= reorderPoint
  const lowStockCount = products.filter((p) => {
    const totalStock = p.stockLevels.reduce((acc, sl) => acc + sl.quantity, 0);
    return totalStock <= p.reorderPoint;
  }).length;

  // KPI 3: Pending Receipts (status DRAFT or READY)
  const receiptsWhere: any = {};
  if (statusFilter) {
    receiptsWhere.status = statusFilter;
  } else {
    receiptsWhere.status = { in: ["DRAFT", "READY"] };
  }
  if (warehouseLocationIds) {
    receiptsWhere.destinationLocationId = { in: warehouseLocationIds };
  }
  const pendingReceipts =
    !docTypeFilter || docTypeFilter === "RECEIPT"
      ? await prisma.receipt.count({ where: receiptsWhere })
      : 0;

  // KPI 4: Pending Deliveries (status WAITING or READY)
  const deliveriesWhere: any = {};
  if (statusFilter) {
    deliveriesWhere.status = statusFilter;
  } else {
    deliveriesWhere.status = { in: ["WAITING", "READY"] };
  }
  if (warehouseLocationIds) {
    deliveriesWhere.lines = {
      some: { sourceLocationId: { in: warehouseLocationIds } },
    };
  }
  const pendingDeliveries =
    !docTypeFilter || docTypeFilter === "DELIVERY"
      ? await prisma.deliveryOrder.count({ where: deliveriesWhere })
      : 0;

  // KPI 5: Internal Transfers Scheduled (status DRAFT)
  const transfersWhere: any = {};
  if (statusFilter) {
    transfersWhere.status = statusFilter;
  } else {
    transfersWhere.status = "DRAFT";
  }
  if (warehouseLocationIds) {
    transfersWhere.OR = [
      { fromLocationId: { in: warehouseLocationIds } },
      { toLocationId: { in: warehouseLocationIds } },
    ];
  }
  const scheduledTransfers =
    !docTypeFilter || docTypeFilter === "TRANSFER"
      ? await prisma.transfer.count({ where: transfersWhere })
      : 0;

  // 3. Smart Reorder Assistant: 14-day velocity from StockLedger
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const ledgerEntries = await prisma.stockLedger.findMany({
    where: {
      documentType: "DELIVERY",
      quantityChange: { lt: 0 },
      createdAt: { gte: fourteenDaysAgo },
      ...(warehouseLocationIds
        ? { locationId: { in: warehouseLocationIds } }
        : {}),
    },
  });

  const consumptionMap: Record<string, number> = {};
  for (const entry of ledgerEntries) {
    consumptionMap[entry.productId] =
      (consumptionMap[entry.productId] || 0) + Math.abs(entry.quantityChange);
  }

  const flaggedProducts: ReorderFlaggedProduct[] = [];
  for (const p of products) {
    const totalStock = p.stockLevels.reduce((acc, sl) => acc + sl.quantity, 0);
    const consumed14d = consumptionMap[p.id] || 0;
    const velocity = consumed14d / 14;
    const isAtOrBelowReorder = totalStock <= p.reorderPoint;
    const daysRemaining = velocity > 0 ? totalStock / velocity : null;
    const isVelocityCritical = daysRemaining !== null && daysRemaining < 7;

    if (isAtOrBelowReorder || isVelocityCritical) {
      const suggestedReorder = Math.max(
        p.reorderQty,
        Math.ceil(velocity * 21)
      );
      flaggedProducts.push({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category.name,
        unit: p.unit.abbreviation,
        currentStock: totalStock,
        reorderPoint: p.reorderPoint,
        velocity,
        daysRemaining: daysRemaining !== null ? Math.round(daysRemaining) : null,
        suggestedReorder,
        reason: isAtOrBelowReorder
          ? "Stock <= Reorder Point"
          : "Runout < 7 Days",
      });
    }
  }

  // 4. Recent Documents: across all 4 types
  const recentDocs: DashboardDocument[] = [];

  const shouldQueryType = (type: string) =>
    !docTypeFilter || docTypeFilter === type;

  const [receipts, deliveries, transfers, adjustments] = await Promise.all([
    shouldQueryType("RECEIPT")
      ? prisma.receipt.findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
          where: {
            ...(statusFilter ? { status: statusFilter as any } : {}),
            ...(warehouseLocationIds
              ? { destinationLocationId: { in: warehouseLocationIds } }
              : {}),
          },
        })
      : Promise.resolve([]),
    shouldQueryType("DELIVERY")
      ? prisma.deliveryOrder.findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
          where: {
            ...(statusFilter ? { status: statusFilter as any } : {}),
            ...(warehouseLocationIds
              ? {
                  lines: {
                    some: { sourceLocationId: { in: warehouseLocationIds } },
                  },
                }
              : {}),
          },
        })
      : Promise.resolve([]),
    shouldQueryType("TRANSFER")
      ? prisma.transfer.findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
          where: {
            ...(statusFilter ? { status: statusFilter as any } : {}),
            ...(warehouseLocationIds
              ? {
                  OR: [
                    { fromLocationId: { in: warehouseLocationIds } },
                    { toLocationId: { in: warehouseLocationIds } },
                  ],
                }
              : {}),
          },
        })
      : Promise.resolve([]),
    shouldQueryType("ADJUSTMENT")
      ? prisma.adjustment.findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
          where: {
            ...(warehouseLocationIds
              ? { locationId: { in: warehouseLocationIds } }
              : {}),
          },
        })
      : Promise.resolve([]),
  ]);

  const [totalReceipts, totalDeliveries, totalTransfers, totalAdjustments] = await Promise.all([
    shouldQueryType("RECEIPT")
      ? prisma.receipt.count({
          where: {
            ...(statusFilter ? { status: statusFilter as any } : {}),
            ...(warehouseLocationIds
              ? { destinationLocationId: { in: warehouseLocationIds } }
              : {}),
          },
        })
      : Promise.resolve(0),
    shouldQueryType("DELIVERY")
      ? prisma.deliveryOrder.count({
          where: {
            ...(statusFilter ? { status: statusFilter as any } : {}),
            ...(warehouseLocationIds
              ? {
                  lines: {
                    some: { sourceLocationId: { in: warehouseLocationIds } },
                  },
                }
              : {}),
          },
        })
      : Promise.resolve(0),
    shouldQueryType("TRANSFER")
      ? prisma.transfer.count({
          where: {
            ...(statusFilter ? { status: statusFilter as any } : {}),
            ...(warehouseLocationIds
              ? {
                  OR: [
                    { fromLocationId: { in: warehouseLocationIds } },
                    { toLocationId: { in: warehouseLocationIds } },
                  ],
                }
              : {}),
          },
        })
      : Promise.resolve(0),
    shouldQueryType("ADJUSTMENT")
      ? prisma.adjustment.count({
          where: {
            ...(warehouseLocationIds
              ? { locationId: { in: warehouseLocationIds } }
              : {}),
          },
        })
      : Promise.resolve(0),
  ]);

  const totalDocumentsCount = totalReceipts + totalDeliveries + totalTransfers + totalAdjustments;

  for (const r of receipts) {
    recentDocs.push({
      id: r.id,
      type: "RECEIPT",
      reference: r.reference,
      locationInfo: "Inbound Receipt",
      status: r.status,
      date: r.createdAt,
    });
  }

  for (const d of deliveries) {
    recentDocs.push({
      id: d.id,
      type: "DELIVERY",
      reference: d.reference,
      locationInfo: d.destinationAddress || "Outbound Delivery",
      status: d.status,
      date: d.createdAt,
    });
  }

  for (const t of transfers) {
    recentDocs.push({
      id: t.id,
      type: "TRANSFER",
      reference: t.reference,
      locationInfo: "Internal Transfer",
      status: t.status,
      date: t.createdAt,
    });
  }

  for (const a of adjustments) {
    recentDocs.push({
      id: a.id,
      type: "ADJUSTMENT",
      reference: a.reference,
      locationInfo: "Manual Adjustment",
      status: "RECORDED",
      date: a.createdAt,
    });
  }

  recentDocs.sort((a, b) => b.date.getTime() - a.date.getTime());
  const finalRecentDocs = recentDocs.slice(0, 8);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 mb-6 border-b border-[var(--color-line)]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-anthracite)] font-mono uppercase">
            Operations Dashboard
          </h1>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            Real-time warehouse metrics, stock health, and reorder forecasting.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <DashboardFilterBar warehouses={warehouses} categories={categories} />

      {/* 5 KPI Cards */}
      <KPICards
        data={{
          totalInStock,
          lowStockCount,
          pendingReceipts,
          pendingDeliveries,
          scheduledTransfers,
        }}
      />

      {/* Smart Reorder Assistant */}
      <ReorderAssistant flaggedProducts={flaggedProducts} />

      {/* Recent Documents Table */}
      <RecentDocumentsTable documents={finalRecentDocs} totalCount={totalDocumentsCount} />
    </div>
  );
}
