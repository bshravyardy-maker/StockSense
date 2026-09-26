import { prisma } from "@/lib/prisma";
import {
  ReceiptStatus,
  DeliveryStatus,
  TransferStatus,
} from "@prisma/client";
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

const RECEIPT_STATUSES = new Set(Object.values(ReceiptStatus));
const DELIVERY_STATUSES = new Set(Object.values(DeliveryStatus));
const TRANSFER_STATUSES = new Set(Object.values(TransferStatus));

const isReceiptStatus = (status: string): status is ReceiptStatus =>
  RECEIPT_STATUSES.has(status as ReceiptStatus);

const isDeliveryStatus = (status: string): status is DeliveryStatus =>
  DELIVERY_STATUSES.has(status as DeliveryStatus);

const isTransferStatus = (status: string): status is TransferStatus =>
  TRANSFER_STATUSES.has(status as TransferStatus);

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
  let pendingReceipts = 0;
  if (!docTypeFilter || docTypeFilter === "RECEIPT") {
    if (!statusFilter || isReceiptStatus(statusFilter)) {
      const receiptsWhere: any = {};
      if (statusFilter) {
        receiptsWhere.status = statusFilter;
      } else {
        receiptsWhere.status = { in: [ReceiptStatus.DRAFT, ReceiptStatus.READY] };
      }
      if (warehouseLocationIds) {
        receiptsWhere.destinationLocationId = { in: warehouseLocationIds };
      }
      pendingReceipts = await prisma.receipt.count({ where: receiptsWhere });
    }
  }

  // KPI 4: Pending Deliveries (status WAITING or READY)
  let pendingDeliveries = 0;
  if (!docTypeFilter || docTypeFilter === "DELIVERY") {
    if (!statusFilter || isDeliveryStatus(statusFilter)) {
      const deliveriesWhere: any = {};
      if (statusFilter) {
        deliveriesWhere.status = statusFilter;
      } else {
        deliveriesWhere.status = { in: [DeliveryStatus.WAITING, DeliveryStatus.READY] };
      }
      if (warehouseLocationIds) {
        deliveriesWhere.lines = {
          some: { sourceLocationId: { in: warehouseLocationIds } },
        };
      }
      pendingDeliveries = await prisma.deliveryOrder.count({ where: deliveriesWhere });
    }
  }

  // KPI 5: Internal Transfers Scheduled (status DRAFT)
  let scheduledTransfers = 0;
  if (!docTypeFilter || docTypeFilter === "TRANSFER") {
    if (!statusFilter || isTransferStatus(statusFilter)) {
      const transfersWhere: any = {};
      if (statusFilter) {
        transfersWhere.status = statusFilter;
      } else {
        transfersWhere.status = TransferStatus.DRAFT;
      }
      if (warehouseLocationIds) {
        transfersWhere.OR = [
          { fromLocationId: { in: warehouseLocationIds } },
          { toLocationId: { in: warehouseLocationIds } },
        ];
      }
      scheduledTransfers = await prisma.transfer.count({ where: transfersWhere });
    }
  }

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

  const shouldQueryReceipts =
    (!docTypeFilter || docTypeFilter === "RECEIPT") &&
    (!statusFilter || isReceiptStatus(statusFilter));

  const shouldQueryDeliveries =
    (!docTypeFilter || docTypeFilter === "DELIVERY") &&
    (!statusFilter || isDeliveryStatus(statusFilter));

  const shouldQueryTransfers =
    (!docTypeFilter || docTypeFilter === "TRANSFER") &&
    (!statusFilter || isTransferStatus(statusFilter));

  const shouldQueryAdjustments =
    (!docTypeFilter || docTypeFilter === "ADJUSTMENT") &&
    !statusFilter;

  const receiptSearchWhere = searchQuery
    ? {
        OR: [
          { reference: { contains: searchQuery, mode: "insensitive" as const } },
          { supplier: { name: { contains: searchQuery, mode: "insensitive" as const } } },
          { lines: { some: { product: { name: { contains: searchQuery, mode: "insensitive" as const } } } } },
          { lines: { some: { product: { sku: { contains: searchQuery, mode: "insensitive" as const } } } } },
        ],
      }
    : {};

  const deliverySearchWhere = searchQuery
    ? {
        OR: [
          { reference: { contains: searchQuery, mode: "insensitive" as const } },
          { destinationAddress: { contains: searchQuery, mode: "insensitive" as const } },
          { lines: { some: { product: { name: { contains: searchQuery, mode: "insensitive" as const } } } } },
          { lines: { some: { product: { sku: { contains: searchQuery, mode: "insensitive" as const } } } } },
        ],
      }
    : {};

  const transferSearchWhere = searchQuery
    ? {
        OR: [
          { reference: { contains: searchQuery, mode: "insensitive" as const } },
          { lines: { some: { product: { name: { contains: searchQuery, mode: "insensitive" as const } } } } },
          { lines: { some: { product: { sku: { contains: searchQuery, mode: "insensitive" as const } } } } },
        ],
      }
    : {};

  const adjustmentSearchWhere = searchQuery
    ? {
        OR: [
          { reference: { contains: searchQuery, mode: "insensitive" as const } },
          { notes: { contains: searchQuery, mode: "insensitive" as const } },
          { lines: { some: { product: { name: { contains: searchQuery, mode: "insensitive" as const } } } } },
          { lines: { some: { product: { sku: { contains: searchQuery, mode: "insensitive" as const } } } } },
        ],
      }
    : {};

  const receiptWhere = shouldQueryReceipts
    ? {
        ...(statusFilter ? { status: statusFilter as ReceiptStatus } : {}),
        ...(warehouseLocationIds
          ? { destinationLocationId: { in: warehouseLocationIds } }
          : {}),
        ...receiptSearchWhere,
      }
    : null;

  const deliveryWhere = shouldQueryDeliveries
    ? {
        ...(statusFilter ? { status: statusFilter as DeliveryStatus } : {}),
        ...(warehouseLocationIds
          ? {
              lines: {
                some: { sourceLocationId: { in: warehouseLocationIds } },
              },
            }
          : {}),
        ...deliverySearchWhere,
      }
    : null;

  const transferWhere = shouldQueryTransfers
    ? {
        ...(statusFilter ? { status: statusFilter as TransferStatus } : {}),
        ...(warehouseLocationIds
          ? {
              OR: [
                { fromLocationId: { in: warehouseLocationIds } },
                { toLocationId: { in: warehouseLocationIds } },
              ],
            }
          : {}),
        ...transferSearchWhere,
      }
    : null;

  const adjustmentWhere = shouldQueryAdjustments
    ? {
        ...(warehouseLocationIds
          ? { locationId: { in: warehouseLocationIds } }
          : {}),
        ...adjustmentSearchWhere,
      }
    : null;

  const [receipts, deliveries, transfers, adjustments] = await Promise.all([
    receiptWhere
      ? prisma.receipt.findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
          where: receiptWhere,
        })
      : Promise.resolve([]),
    deliveryWhere
      ? prisma.deliveryOrder.findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
          where: deliveryWhere,
        })
      : Promise.resolve([]),
    transferWhere
      ? prisma.transfer.findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
          where: transferWhere,
        })
      : Promise.resolve([]),
    adjustmentWhere
      ? prisma.adjustment.findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
          where: adjustmentWhere,
        })
      : Promise.resolve([]),
  ]);

  const [totalReceipts, totalDeliveries, totalTransfers, totalAdjustments] = await Promise.all([
    receiptWhere
      ? prisma.receipt.count({ where: receiptWhere })
      : Promise.resolve(0),
    deliveryWhere
      ? prisma.deliveryOrder.count({ where: deliveryWhere })
      : Promise.resolve(0),
    transferWhere
      ? prisma.transfer.count({ where: transferWhere })
      : Promise.resolve(0),
    adjustmentWhere
      ? prisma.adjustment.count({ where: adjustmentWhere })
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
