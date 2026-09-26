const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetDb() {
  console.log('Resetting test operational data in DB...');

  // Delete all operations & ledger
  await prisma.stockLedger.deleteMany({});
  await prisma.adjustmentLine.deleteMany({});
  await prisma.adjustment.deleteMany({});
  await prisma.transferLine.deleteMany({});
  await prisma.transfer.deleteMany({});
  await prisma.deliveryLine.deleteMany({});
  await prisma.deliveryOrder.deleteMany({});
  await prisma.receiptLine.deleteMany({});
  await prisma.receipt.deleteMany({});

  // Reset stock levels to initial state
  const rackA = await prisma.location.findFirst({ where: { shortCode: 'STOCK1' } });
  const rackB = await prisma.location.findFirst({ where: { shortCode: 'STOCK2' } });
  const line1 = await prisma.location.findFirst({ where: { shortCode: 'LINE1' } });

  const steel = await prisma.product.findUnique({ where: { sku: 'STL-001' } });
  const chairs = await prisma.product.findUnique({ where: { sku: 'CHR-014' } });
  const frames = await prisma.product.findUnique({ where: { sku: 'FRM-007' } });
  const boxes = await prisma.product.findUnique({ where: { sku: 'PKG-002' } });
  const desks = await prisma.product.findUnique({ where: { sku: 'DSK-001' } });
  const tables = await prisma.product.findUnique({ where: { sku: 'TBL-003' } });

  // Clear all stock levels first
  await prisma.stockLevel.deleteMany({});

  // Re-seed standard stock
  const stock = [
    { productId: steel.id, locationId: rackA.id, quantity: 120 },
    { productId: steel.id, locationId: line1.id, quantity: 30 },
    { productId: chairs.id, locationId: rackA.id, quantity: 40 },
    { productId: frames.id, locationId: line1.id, quantity: 25 },
    { productId: boxes.id, locationId: rackB.id, quantity: 250 },
    { productId: desks.id, locationId: rackA.id, quantity: 80 },
    { productId: tables.id, locationId: rackA.id, quantity: 60 },
  ];

  for (const s of stock) {
    await prisma.stockLevel.create({
      data: {
        productId: s.productId,
        locationId: s.locationId,
        quantity: s.quantity,
        reserved: 0,
      }
    });
  }

  console.log('Database operational state successfully reset to initial seed values!');
}

resetDb()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
