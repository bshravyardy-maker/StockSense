import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Categories & units
  const categories = await Promise.all(
    ["Raw Materials", "Components", "Finished Goods", "Packaging"].map((name) =>
      prisma.category.upsert({ where: { name }, update: {}, create: { name } })
    )
  );
  const kg = await prisma.unitOfMeasure.upsert({
    where: { abbreviation: "kg" }, update: {}, create: { name: "Kilogram", abbreviation: "kg" },
  });
  const unit = await prisma.unitOfMeasure.upsert({
    where: { abbreviation: "unit" }, update: {}, create: { name: "Unit", abbreviation: "unit" },
  });

  // Demo users
  const passwordHash = await bcrypt.hash("Demo1234!", 10);
  await prisma.user.upsert({
    where: { loginId: "manager@stocksense.demo" },
    update: {},
    create: {
      loginId: "manager@stocksense.demo",
      name: "Demo Manager",
      passwordHash,
      role: "MANAGER",
    },
  });
  await prisma.user.upsert({
    where: { loginId: "staff@stocksense.demo" },
    update: {},
    create: {
      loginId: "staff@stocksense.demo",
      name: "Demo Staff",
      passwordHash,
      role: "STAFF",
    },
  });

  // Warehouses & locations
  const mainWh = await prisma.warehouse.upsert({
    where: { shortCode: "WH" }, update: {},
    create: { name: "Main Warehouse", shortCode: "WH", address: "12 Industrial Ave" },
  });
  const prod = await prisma.warehouse.upsert({
    where: { shortCode: "PF" }, update: {},
    create: { name: "Production Floor", shortCode: "PF" },
  });

  const rackA = await prisma.location.upsert({
    where: { warehouseId_shortCode: { warehouseId: mainWh.id, shortCode: "STOCK1" } },
    update: {}, create: { name: "Rack A", shortCode: "STOCK1", warehouseId: mainWh.id },
  });
  const rackB = await prisma.location.upsert({
    where: { warehouseId_shortCode: { warehouseId: mainWh.id, shortCode: "STOCK2" } },
    update: {}, create: { name: "Rack B", shortCode: "STOCK2", warehouseId: mainWh.id },
  });
  const line1 = await prisma.location.upsert({
    where: { warehouseId_shortCode: { warehouseId: prod.id, shortCode: "LINE1" } },
    update: {}, create: { name: "Line 1", shortCode: "LINE1", warehouseId: prod.id },
  });

  // Products
  const steel = await prisma.product.upsert({
    where: { sku: "STL-001" }, update: {},
    create: { name: "Steel Rods", sku: "STL-001", categoryId: categories[0].id, unitId: kg.id, unitCost: 300, reorderPoint: 80, reorderQty: 200 },
  });
  const chairs = await prisma.product.upsert({
    where: { sku: "CHR-014" }, update: {},
    create: { name: "Wooden Chairs", sku: "CHR-014", categoryId: categories[2].id, unitId: unit.id, unitCost: 3000, reorderPoint: 15, reorderQty: 50 },
  });
  const frames = await prisma.product.upsert({
    where: { sku: "FRM-007" }, update: {},
    create: { name: "Steel Frames", sku: "FRM-007", categoryId: categories[1].id, unitId: unit.id, unitCost: 1200, reorderPoint: 20, reorderQty: 60 },
  });
  const boxes = await prisma.product.upsert({
    where: { sku: "PKG-002" }, update: {},
    create: { name: "Cardboard Boxes", sku: "PKG-002", categoryId: categories[3].id, unitId: unit.id, unitCost: 40, reorderPoint: 100, reorderQty: 300 },
  });
  const desks = await prisma.product.upsert({
    where: { sku: "DSK-001" }, update: {},
    create: { name: "Desks", sku: "DSK-001", categoryId: categories[2].id, unitId: unit.id, unitCost: 3000, reorderPoint: 20, reorderQty: 40 },
  });
  const tables = await prisma.product.upsert({
    where: { sku: "TBL-003" }, update: {},
    create: { name: "Tables", sku: "TBL-003", categoryId: categories[2].id, unitId: unit.id, unitCost: 3000, reorderPoint: 20, reorderQty: 40 },
  });

  // Stock levels for products whose levels are NOT driven by ledger history below.
  // chairs and frames stock levels are set later (after ledger insertion) to
  // reflect their simulated current balances.
  const baseStock: [string, string, number][] = [
    [steel.id, rackA.id, 120],
    [steel.id, line1.id, 30],
    [boxes.id, rackB.id, 250],
    [desks.id, rackA.id, 80],
    [tables.id, rackA.id, 60],
  ];
  for (const [productId, locationId, quantity] of baseStock) {
    await prisma.stockLevel.upsert({
      where: { productId_locationId: { productId, locationId } },
      update: { quantity },
      create: { productId, locationId, quantity },
    });
  }

  // Supplier
  const acme = await prisma.supplier.upsert({
    where: { id: "seed-supplier-acme" }, update: {},
    create: { id: "seed-supplier-acme", name: "Acme Steel Co.", contactEmail: "sales@acmesteel.example" },
  });

  // ---------------------------------------------------------------------------
  // HISTORICAL STOCK LEDGER ENTRIES  (idempotent — skipped on re-run)
  //
  // Simulates 21 days of warehouse activity so the Smart Reorder Assistant has
  // real velocity data. All seeded entries use documentRef prefix "SEED-HIST-"
  // which is distinct from real manual-test documents (WH/IN/0001, WH/OUT/0001,
  // WH/TR/0001, WH/ADJ/0001) — those are never touched here.
  //
  // Products targeted:
  //   1. Wooden Chairs (CHR-014) — ends below reorderPoint → "Stock <= Reorder Point"
  //   2. Steel Frames  (FRM-007) — ends above reorderPoint but high velocity   → "Runout < 7 Days"
  // ---------------------------------------------------------------------------
  const existingHistoricalCount = await prisma.stockLedger.count({
    where: { documentRef: { startsWith: "SEED-HIST-" } },
  });

  if (existingHistoricalCount > 0) {
    console.log(
      `Skipping historical ledger seed — ${existingHistoricalCount} SEED-HIST-* entries already present.`
    );
  } else {
    // Returns a Date N whole days before the current moment.
    const daysAgo = (n: number): Date =>
      new Date(Date.now() - n * 24 * 60 * 60 * 1000);

    type DocType = "RECEIPT" | "DELIVERY" | "TRANSFER" | "ADJUSTMENT";
    interface LedgerRow {
      documentType: DocType;
      documentRef: string;
      daysAgoNum: number;
      quantityChange: number;
      balanceAfter: number;
      notes?: string;
    }

    // ── WOODEN CHAIRS (CHR-014) ──────────────────────────────────────────────
    // Desired outcome:
    //   currentStock = 12  |  reorderPoint = 15
    //   → totalStock (12) <= reorderPoint (15) → "Stock <= Reorder Point"
    //
    // 14-day DELIVERY consumption (days 0–13):
    //   5+4+3+5+4+5+6+5+3+3 = 43 units → velocity = 43/14 ≈ 3.07/day
    //   daysRemaining = 12 / 3.07 ≈ 3.9 days (also triggers velocity condition)
    //
    // Running balance (starting at 0, receipt starts at 75):
    //   Day -21: RECEIPT  +75 = 75
    //   Day -19: DELIVERY  -4 = 71
    //   Day -17: DELIVERY  -3 = 68
    //   Day -15: DELIVERY  -4 = 64
    //   Day -13: DELIVERY  -3 = 61
    //   Day -11: DELIVERY  -4 = 57
    //   Day  -9: DELIVERY  -3 = 54
    //   Day  -8: TRANSFER  -5 = 49  (internal move — does NOT count in velocity)
    //   Day  -7: DELIVERY  -4 = 45
    //   Day  -6: DELIVERY  -5 = 40  ← 14-day window opens (entries from here count)
    //   Day  -5: DELIVERY  -4 = 36
    //   Day  -4: DELIVERY  -3 = 33
    //   Day  -3: DELIVERY  -5 = 28
    //   Day  -2: DELIVERY  -4 = 24
    //   Day  -2: RECEIPT  +10 = 34  (emergency top-up — receipt, not counted in velocity)
    //   Day  -2: DELIVERY  -5 = 29
    //   Day  -1: DELIVERY  -6 = 23
    //   Day  -1: DELIVERY  -5 = 18
    //   Day   0: DELIVERY  -3 = 15
    //   Day   0: DELIVERY  -3 = 12  ← current balance
    const chairsLedger: LedgerRow[] = [
      { documentType: "RECEIPT",  documentRef: "SEED-HIST-CHR-IN-001",  daysAgoNum: 21, quantityChange: 75, balanceAfter: 75,  notes: "Opening stock receipt — supplier batch A12" },
      { documentType: "DELIVERY", documentRef: "SEED-HIST-CHR-OUT-001", daysAgoNum: 19, quantityChange: -4, balanceAfter: 71,  notes: "Customer order #C-0091" },
      { documentType: "DELIVERY", documentRef: "SEED-HIST-CHR-OUT-002", daysAgoNum: 17, quantityChange: -3, balanceAfter: 68,  notes: "Customer order #C-0095" },
      { documentType: "DELIVERY", documentRef: "SEED-HIST-CHR-OUT-003", daysAgoNum: 15, quantityChange: -4, balanceAfter: 64,  notes: "Customer order #C-0099" },
      { documentType: "DELIVERY", documentRef: "SEED-HIST-CHR-OUT-004", daysAgoNum: 13, quantityChange: -3, balanceAfter: 61,  notes: "Customer order #C-0104" },
      { documentType: "DELIVERY", documentRef: "SEED-HIST-CHR-OUT-005", daysAgoNum: 11, quantityChange: -4, balanceAfter: 57,  notes: "Customer order #C-0109" },
      { documentType: "DELIVERY", documentRef: "SEED-HIST-CHR-OUT-006", daysAgoNum:  9, quantityChange: -3, balanceAfter: 54,  notes: "Customer order #C-0112" },
      { documentType: "TRANSFER", documentRef: "SEED-HIST-CHR-TR-001",  daysAgoNum:  8, quantityChange: -5, balanceAfter: 49,  notes: "Internal move to Production Floor sample staging" },
      { documentType: "DELIVERY", documentRef: "SEED-HIST-CHR-OUT-007", daysAgoNum:  7, quantityChange: -4, balanceAfter: 45,  notes: "Customer order #C-0116" },
      // ── inside 14-day velocity window ──
      { documentType: "DELIVERY", documentRef: "SEED-HIST-CHR-OUT-008", daysAgoNum:  6, quantityChange: -5, balanceAfter: 40,  notes: "Customer order #C-0118" },
      { documentType: "DELIVERY", documentRef: "SEED-HIST-CHR-OUT-009", daysAgoNum:  5, quantityChange: -4, balanceAfter: 36,  notes: "Customer order #C-0121" },
      { documentType: "DELIVERY", documentRef: "SEED-HIST-CHR-OUT-010", daysAgoNum:  4, quantityChange: -3, balanceAfter: 33,  notes: "Customer order #C-0124" },
      { documentType: "DELIVERY", documentRef: "SEED-HIST-CHR-OUT-011", daysAgoNum:  3, quantityChange: -5, balanceAfter: 28,  notes: "Customer order #C-0127" },
      { documentType: "DELIVERY", documentRef: "SEED-HIST-CHR-OUT-012", daysAgoNum:  2, quantityChange: -4, balanceAfter: 24,  notes: "Customer order #C-0130" },
      { documentType: "RECEIPT",  documentRef: "SEED-HIST-CHR-IN-002",  daysAgoNum:  2, quantityChange: 10, balanceAfter: 34,  notes: "Emergency top-up — partial supplier delivery" },
      { documentType: "DELIVERY", documentRef: "SEED-HIST-CHR-OUT-013", daysAgoNum:  2, quantityChange: -5, balanceAfter: 29,  notes: "Customer order #C-0131" },
      { documentType: "DELIVERY", documentRef: "SEED-HIST-CHR-OUT-014", daysAgoNum:  1, quantityChange: -6, balanceAfter: 23,  notes: "Customer order #C-0134" },
      { documentType: "DELIVERY", documentRef: "SEED-HIST-CHR-OUT-015", daysAgoNum:  1, quantityChange: -5, balanceAfter: 18,  notes: "Customer order #C-0136" },
      { documentType: "DELIVERY", documentRef: "SEED-HIST-CHR-OUT-016", daysAgoNum:  0, quantityChange: -3, balanceAfter: 15,  notes: "Customer order #C-0139" },
      { documentType: "DELIVERY", documentRef: "SEED-HIST-CHR-OUT-017", daysAgoNum:  0, quantityChange: -3, balanceAfter: 12,  notes: "Customer order #C-0141" },
    ];

    for (const e of chairsLedger) {
      await prisma.stockLedger.create({
        data: {
          documentType:   e.documentType,
          documentId:     `seed-hist-${e.documentRef.toLowerCase()}`,
          documentRef:    e.documentRef,
          productId:      chairs.id,
          locationId:     rackA.id,
          quantityChange: e.quantityChange,
          balanceAfter:   e.balanceAfter,
          notes:          e.notes ?? null,
          createdAt:      daysAgo(e.daysAgoNum),
        },
      });
    }

    // Sync StockLevel for Wooden Chairs to match ledger endpoint
    await prisma.stockLevel.upsert({
      where:  { productId_locationId: { productId: chairs.id, locationId: rackA.id } },
      update: { quantity: 12 },
      create: { productId: chairs.id, locationId: rackA.id, quantity: 12 },
    });

    // ── STEEL FRAMES (FRM-007) ───────────────────────────────────────────────
    // Desired outcome:
    //   currentStock = 28  |  reorderPoint = 20
    //   28 > 20 → static badge does NOT fire
    //
    // 14-day DELIVERY consumption (days 0–13):
    //   exactly 14 deliveries of 6 units each = 84 units
    //   velocity = 84 / 14 = 6.00 units/day
    //   daysRemaining = 28 / 6 ≈ 4.7 days < 7 → "Runout < 7 Days" ✓
    //
    // Running balance:
    //   Day -21: RECEIPT  +150 = 150
    //   Day -19: DELIVERY  -8  = 142
    //   Day -17: DELIVERY  -6  = 136
    //   Day -15: DELIVERY  -8  = 128  (pre-window)
    //   Day -14: DELIVERY  -6  = 122  ← 14-day window opens
    //   Day -13: DELIVERY  -6  = 116
    //   Day -12: TRANSFER  +8  = 124  (internal replenishment — not in velocity)
    //   Day -11: DELIVERY  -6  = 118
    //   Day  -9: DELIVERY  -6  = 112
    //   Day  -8: DELIVERY  -6  = 106
    //   Day  -7: DELIVERY  -6  = 100
    //   Day  -6: DELIVERY  -6  =  94
    //   Day  -5: DELIVERY  -6  =  88
    //   Day  -4: DELIVERY  -6  =  82
    //   Day  -3: ADJUSTMENT -4 =  78  (cycle-count correction — not in velocity)
    //   Day  -3: DELIVERY  -6  =  72
    //   Day  -2: DELIVERY  -6  =  66
    //   Day  -1: DELIVERY  -6  =  60
    //   Day  -1: DELIVERY  -6  =  54
    //   Day   0: DELIVERY  -6  =  48
    //   Day   0: DELIVERY  -6  =  42
    //   Day   0: DELIVERY  -6  =  36
    //   Day   0: DELIVERY  -8  =  28  ← current balance
    //
    // 14-day DELIVERY outflows counted by dashboard (daysAgoNum 0–13, docType=DELIVERY, quantityChange<0):
    //   6+6+6+6+6+6+6+6+6+6+6+6+6+6+8 = ... wait, let me count entries:
    //   d-14: -6, d-13: -6, d-11: -6, d-9: -6, d-8: -6, d-7: -6, d-6: -6,
    //   d-5: -6, d-4: -6, d-3: -6, d-2: -6, d-1: -6, d-1: -6, d-0: -6,
    //   d-0: -6, d-0: -6, d-0: -8
    //   = 6*16 + 8 = 104 → velocity = 104/14 ≈ 7.43/day, daysRemaining = 28/7.43 ≈ 3.8 days
    //   Still well under 7, satisfying the velocity condition clearly.
    const framesLedger: LedgerRow[] = [
      { documentType: "RECEIPT",    documentRef: "SEED-HIST-FRM-IN-001",  daysAgoNum: 21, quantityChange: 150, balanceAfter: 150, notes: "Bulk supplier shipment — batch F-220" },
      { documentType: "DELIVERY",   documentRef: "SEED-HIST-FRM-OUT-001", daysAgoNum: 19, quantityChange:  -8, balanceAfter: 142, notes: "Factory order #F-0041" },
      { documentType: "DELIVERY",   documentRef: "SEED-HIST-FRM-OUT-002", daysAgoNum: 17, quantityChange:  -6, balanceAfter: 136, notes: "Factory order #F-0044" },
      { documentType: "DELIVERY",   documentRef: "SEED-HIST-FRM-OUT-003", daysAgoNum: 15, quantityChange:  -8, balanceAfter: 128, notes: "Factory order #F-0048" },
      // ── inside 14-day velocity window (daysAgoNum 0–14) ──
      { documentType: "DELIVERY",   documentRef: "SEED-HIST-FRM-OUT-004", daysAgoNum: 14, quantityChange:  -6, balanceAfter: 122, notes: "Factory order #F-0051" },
      { documentType: "DELIVERY",   documentRef: "SEED-HIST-FRM-OUT-005", daysAgoNum: 13, quantityChange:  -6, balanceAfter: 116, notes: "Factory order #F-0053" },
      { documentType: "TRANSFER",   documentRef: "SEED-HIST-FRM-TR-001",  daysAgoNum: 12, quantityChange:   8, balanceAfter: 124, notes: "Internal replenishment from secondary storage" },
      { documentType: "DELIVERY",   documentRef: "SEED-HIST-FRM-OUT-006", daysAgoNum: 11, quantityChange:  -6, balanceAfter: 118, notes: "Factory order #F-0056" },
      { documentType: "DELIVERY",   documentRef: "SEED-HIST-FRM-OUT-007", daysAgoNum:  9, quantityChange:  -6, balanceAfter: 112, notes: "Factory order #F-0059" },
      { documentType: "DELIVERY",   documentRef: "SEED-HIST-FRM-OUT-008", daysAgoNum:  8, quantityChange:  -6, balanceAfter: 106, notes: "Factory order #F-0061" },
      { documentType: "DELIVERY",   documentRef: "SEED-HIST-FRM-OUT-009", daysAgoNum:  7, quantityChange:  -6, balanceAfter: 100, notes: "Factory order #F-0063" },
      { documentType: "DELIVERY",   documentRef: "SEED-HIST-FRM-OUT-010", daysAgoNum:  6, quantityChange:  -6, balanceAfter:  94, notes: "Factory order #F-0066" },
      { documentType: "DELIVERY",   documentRef: "SEED-HIST-FRM-OUT-011", daysAgoNum:  5, quantityChange:  -6, balanceAfter:  88, notes: "Factory order #F-0069" },
      { documentType: "DELIVERY",   documentRef: "SEED-HIST-FRM-OUT-012", daysAgoNum:  4, quantityChange:  -6, balanceAfter:  82, notes: "Factory order #F-0071" },
      { documentType: "ADJUSTMENT", documentRef: "SEED-HIST-FRM-ADJ-001", daysAgoNum:  3, quantityChange:  -4, balanceAfter:  78, notes: "Cycle count correction — 4 units damaged in transit" },
      { documentType: "DELIVERY",   documentRef: "SEED-HIST-FRM-OUT-013", daysAgoNum:  3, quantityChange:  -6, balanceAfter:  72, notes: "Factory order #F-0073" },
      { documentType: "DELIVERY",   documentRef: "SEED-HIST-FRM-OUT-014", daysAgoNum:  2, quantityChange:  -6, balanceAfter:  66, notes: "Factory order #F-0075" },
      { documentType: "DELIVERY",   documentRef: "SEED-HIST-FRM-OUT-015", daysAgoNum:  1, quantityChange:  -6, balanceAfter:  60, notes: "Factory order #F-0078" },
      { documentType: "DELIVERY",   documentRef: "SEED-HIST-FRM-OUT-016", daysAgoNum:  1, quantityChange:  -6, balanceAfter:  54, notes: "Factory order #F-0080" },
      { documentType: "DELIVERY",   documentRef: "SEED-HIST-FRM-OUT-017", daysAgoNum:  0, quantityChange:  -6, balanceAfter:  48, notes: "Factory order #F-0082" },
      { documentType: "DELIVERY",   documentRef: "SEED-HIST-FRM-OUT-018", daysAgoNum:  0, quantityChange:  -6, balanceAfter:  42, notes: "Factory order #F-0083" },
      { documentType: "DELIVERY",   documentRef: "SEED-HIST-FRM-OUT-019", daysAgoNum:  0, quantityChange:  -6, balanceAfter:  36, notes: "Factory order #F-0084" },
      { documentType: "DELIVERY",   documentRef: "SEED-HIST-FRM-OUT-020", daysAgoNum:  0, quantityChange:  -8, balanceAfter:  28, notes: "Factory order #F-0085 — current balance" },
    ];

    for (const e of framesLedger) {
      await prisma.stockLedger.create({
        data: {
          documentType:   e.documentType,
          documentId:     `seed-hist-${e.documentRef.toLowerCase()}`,
          documentRef:    e.documentRef,
          productId:      frames.id,
          locationId:     line1.id,
          quantityChange: e.quantityChange,
          balanceAfter:   e.balanceAfter,
          notes:          e.notes ?? null,
          createdAt:      daysAgo(e.daysAgoNum),
        },
      });
    }

    // Sync StockLevel for Steel Frames to match ledger endpoint
    await prisma.stockLevel.upsert({
      where:  { productId_locationId: { productId: frames.id, locationId: line1.id } },
      update: { quantity: 28 },
      create: { productId: frames.id, locationId: line1.id, quantity: 28 },
    });

    console.log("Historical ledger seed complete:");
    console.log("  Wooden Chairs: 20 entries | stock=12 | reorderPoint=15 | → 'Stock <= Reorder Point'");
    console.log("  Steel Frames:  23 entries | stock=28 | reorderPoint=20 | velocity≈7.4/day | daysRemaining≈3.8 | → 'Runout < 7 Days'");
  }

  console.log("Seed complete:", { categories: categories.length, warehouses: 2, products: 6, supplier: acme.name });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
