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
  const main = await prisma.warehouse.upsert({
    where: { shortCode: "WH" }, update: {},
    create: { name: "Main Warehouse", shortCode: "WH", address: "12 Industrial Ave" },
  });
  const prod = await prisma.warehouse.upsert({
    where: { shortCode: "PF" }, update: {},
    create: { name: "Production Floor", shortCode: "PF" },
  });

  const rackA = await prisma.location.upsert({
    where: { warehouseId_shortCode: { warehouseId: main.id, shortCode: "STOCK1" } },
    update: {}, create: { name: "Rack A", shortCode: "STOCK1", warehouseId: main.id },
  });
  const rackB = await prisma.location.upsert({
    where: { warehouseId_shortCode: { warehouseId: main.id, shortCode: "STOCK2" } },
    update: {}, create: { name: "Rack B", shortCode: "STOCK2", warehouseId: main.id },
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

  // Stock levels
  const stock = [
    [steel.id, rackA.id, 120], [steel.id, line1.id, 30],
    [chairs.id, rackA.id, 40], [frames.id, line1.id, 25],
    [boxes.id, rackB.id, 250], [desks.id, rackA.id, 80], [tables.id, rackA.id, 60],
  ] as const;
  for (const [productId, locationId, quantity] of stock) {
    await prisma.stockLevel.upsert({
      where: { productId_locationId: { productId, locationId } },
      update: { quantity }, create: { productId, locationId, quantity },
    });
  }

  // Supplier
  const acme = await prisma.supplier.upsert({
    where: { id: "seed-supplier-acme" }, update: {},
    create: { id: "seed-supplier-acme", name: "Acme Steel Co.", contactEmail: "sales@acmesteel.example" },
  });

  console.log("Seed complete:", { categories: categories.length, warehouses: 2, products: 6, supplier: acme.name });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
