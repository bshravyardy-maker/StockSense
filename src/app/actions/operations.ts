"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ----------------------------------------------------
// 1. RECEIPTS
// ----------------------------------------------------

export async function createReceipt(data: {
  supplierId: string;
  destinationLocationId: string;
  scheduleDate?: string;
  notes?: string;
  lines: Array<{ productId: string; quantity: number }>;
}) {
  if (!data.supplierId || !data.destinationLocationId || !data.lines?.length) {
    return { error: "Supplier, destination location, and at least one item are required." };
  }

  try {
    const location = await prisma.location.findUnique({
      where: { id: data.destinationLocationId },
      include: { warehouse: true },
    });

    if (!location) {
      return { error: "Destination location not found." };
    }

    const whCode = location.warehouse.shortCode;
    const count = await prisma.receipt.count();
    const reference = `${whCode}/IN/${String(count + 1).padStart(4, "0")}`;

    const receipt = await prisma.receipt.create({
      data: {
        reference,
        supplierId: data.supplierId,
        destinationLocationId: data.destinationLocationId,
        status: "DRAFT",
        scheduleDate: data.scheduleDate ? new Date(data.scheduleDate) : null,
        notes: data.notes || null,
        lines: {
          create: data.lines.map((l) => ({
            productId: l.productId,
            quantity: Math.max(1, Math.floor(l.quantity)),
          })),
        },
      },
    });

    revalidatePath("/operations/receipts");
    revalidatePath("/dashboard");
    return { success: true, receipt };
  } catch (err: any) {
    console.error("createReceipt error:", err);
    return { error: err.message || "Failed to create receipt." };
  }
}

export async function validateReceipt(receiptId: string) {
  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: {
        supplier: true,
        lines: true,
      },
    });

    if (!receipt) return { error: "Receipt not found." };
    if (receipt.status === "DONE") return { error: "Receipt is already completed." };
    if (receipt.status === "CANCELLED") return { error: "Cannot validate cancelled receipt." };

    await prisma.$transaction(async (tx) => {
      // 1. Mark status DONE
      await tx.receipt.update({
        where: { id: receiptId },
        data: { status: "DONE" },
      });

      // 2. Increment stock and write ledger entries
      for (const line of receipt.lines) {
        const currentStock = await tx.stockLevel.findUnique({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: receipt.destinationLocationId,
            },
          },
        });

        const newQuantity = (currentStock?.quantity || 0) + line.quantity;

        await tx.stockLevel.upsert({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: receipt.destinationLocationId,
            },
          },
          update: { quantity: newQuantity },
          create: {
            productId: line.productId,
            locationId: receipt.destinationLocationId,
            quantity: newQuantity,
            reserved: 0,
          },
        });

        await tx.stockLedger.create({
          data: {
            documentType: "RECEIPT",
            documentId: receipt.id,
            documentRef: receipt.reference,
            productId: line.productId,
            locationId: receipt.destinationLocationId,
            quantityChange: line.quantity,
            balanceAfter: newQuantity,
            notes: `Inbound receipt from ${receipt.supplier.name}`,
          },
        });
      }
    });

    revalidatePath("/operations/receipts");
    revalidatePath("/products");
    revalidatePath("/stock");
    revalidatePath("/dashboard");
    revalidatePath("/operations/moves");

    return { success: true };
  } catch (err: any) {
    console.error("validateReceipt error:", err);
    return { error: err.message || "Failed to validate receipt." };
  }
}

export async function cancelReceipt(receiptId: string) {
  try {
    const receipt = await prisma.receipt.findUnique({ where: { id: receiptId } });
    if (!receipt) return { error: "Receipt not found." };
    if (receipt.status === "DONE") return { error: "Cannot cancel completed receipt." };

    await prisma.receipt.update({
      where: { id: receiptId },
      data: { status: "CANCELLED" },
    });

    revalidatePath("/operations/receipts");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to cancel receipt." };
  }
}

export async function markReceiptReady(receiptId: string) {
  try {
    const receipt = await prisma.receipt.findUnique({ where: { id: receiptId } });
    if (!receipt) return { error: "Receipt not found." };
    if (receipt.status !== "DRAFT") return { error: "Only DRAFT receipts can be marked as Ready." };

    await prisma.receipt.update({
      where: { id: receiptId },
      data: { status: "READY" },
    });

    revalidatePath("/operations/receipts");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to mark receipt as Ready." };
  }
}

// ----------------------------------------------------
// 2. DELIVERIES
// ----------------------------------------------------

export async function createDeliveryOrder(data: {
  destinationAddress: string;
  scheduleDate?: string;
  notes?: string;
  lines: Array<{ productId: string; sourceLocationId: string; quantity: number }>;
}) {
  if (!data.destinationAddress || !data.lines?.length) {
    return { error: "Destination address and at least one item are required." };
  }

  try {
    const firstLoc = await prisma.location.findUnique({
      where: { id: data.lines[0].sourceLocationId },
      include: { warehouse: true },
    });

    const whCode = firstLoc?.warehouse.shortCode || "WH";
    const count = await prisma.deliveryOrder.count();
    const reference = `${whCode}/OUT/${String(count + 1).padStart(4, "0")}`;

    const delivery = await prisma.$transaction(async (tx) => {
      const order = await tx.deliveryOrder.create({
        data: {
          reference,
          destinationAddress: data.destinationAddress,
          status: "DRAFT",
          scheduleDate: data.scheduleDate ? new Date(data.scheduleDate) : null,
          notes: data.notes || null,
          lines: {
            create: data.lines.map((l) => ({
              productId: l.productId,
              sourceLocationId: l.sourceLocationId,
              quantity: Math.max(1, Math.floor(l.quantity)),
            })),
          },
        },
      });

      return order;
    });

    revalidatePath("/operations/deliveries");
    revalidatePath("/stock");
    revalidatePath("/dashboard");
    return { success: true, delivery };
  } catch (err: any) {
    console.error("createDeliveryOrder error:", err);
    return { error: err.message || "Failed to create delivery order." };
  }
}

export async function markDeliveryWaiting(deliveryId: string) {
  try {
    const delivery = await prisma.deliveryOrder.findUnique({
      where: { id: deliveryId },
      include: { lines: true },
    });
    if (!delivery) return { error: "Delivery order not found." };
    if (delivery.status !== "DRAFT") return { error: "Only DRAFT orders can be moved to Waiting." };

    // Reserve stock for each line
    await prisma.$transaction(async (tx) => {
      await tx.deliveryOrder.update({ where: { id: deliveryId }, data: { status: "WAITING" } });
      for (const line of delivery.lines) {
        await tx.stockLevel.upsert({
          where: { productId_locationId: { productId: line.productId, locationId: line.sourceLocationId } },
          update: { reserved: { increment: line.quantity } },
          create: { productId: line.productId, locationId: line.sourceLocationId, quantity: 0, reserved: line.quantity },
        });
      }
    });

    revalidatePath("/operations/deliveries");
    revalidatePath("/stock");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to advance delivery to Waiting." };
  }
}

export async function markDeliveryReady(deliveryId: string) {
  try {
    const delivery = await prisma.deliveryOrder.findUnique({ where: { id: deliveryId } });
    if (!delivery) return { error: "Delivery order not found." };
    if (delivery.status !== "WAITING") return { error: "Only WAITING orders can be marked as Ready." };

    await prisma.deliveryOrder.update({ where: { id: deliveryId }, data: { status: "READY" } });

    revalidatePath("/operations/deliveries");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to mark delivery as Ready." };
  }
}


export async function validateDelivery(deliveryId: string) {
  try {
    const delivery = await prisma.deliveryOrder.findUnique({
      where: { id: deliveryId },
      include: { lines: true },
    });

    if (!delivery) return { error: "Delivery order not found." };
    if (delivery.status !== "READY") return { error: "Only READY delivery orders can be validated and shipped. Advance the order through Waiting first." };

    await prisma.$transaction(async (tx) => {
      // 1. Mark status DONE
      await tx.deliveryOrder.update({
        where: { id: deliveryId },
        data: { status: "DONE" },
      });

      // 2. Decrement stock, release reservation, and write ledger
      for (const line of delivery.lines) {
        const currentStock = await tx.stockLevel.findUnique({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: line.sourceLocationId,
            },
          },
        });

        const newQuantity = (currentStock?.quantity || 0) - line.quantity;
        const newReserved = Math.max(0, (currentStock?.reserved || 0) - line.quantity);

        await tx.stockLevel.update({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: line.sourceLocationId,
            },
          },
          data: {
            quantity: newQuantity,
            reserved: newReserved,
          },
        });

        await tx.stockLedger.create({
          data: {
            documentType: "DELIVERY",
            documentId: delivery.id,
            documentRef: delivery.reference,
            productId: line.productId,
            locationId: line.sourceLocationId,
            quantityChange: -line.quantity, // negative change
            balanceAfter: newQuantity,
            notes: `Delivery order out to ${delivery.destinationAddress || "Client"}`,
          },
        });
      }
    });

    revalidatePath("/operations/deliveries");
    revalidatePath("/products");
    revalidatePath("/stock");
    revalidatePath("/dashboard");
    revalidatePath("/operations/moves");

    return { success: true };
  } catch (err: any) {
    console.error("validateDelivery error:", err);
    return { error: err.message || "Failed to validate delivery." };
  }
}

export async function cancelDelivery(deliveryId: string) {
  try {
    const delivery = await prisma.deliveryOrder.findUnique({
      where: { id: deliveryId },
      include: { lines: true },
    });

    if (!delivery) return { error: "Delivery order not found." };
    if (delivery.status === "DONE") return { error: "Cannot cancel completed delivery." };

    await prisma.$transaction(async (tx) => {
      await tx.deliveryOrder.update({
        where: { id: deliveryId },
        data: { status: "CANCELLED" },
      });

      // Only release reservations if stock was reserved (WAITING or READY states)
      if (delivery.status === "WAITING" || delivery.status === "READY") {
        for (const line of delivery.lines) {
          const currentStock = await tx.stockLevel.findUnique({
            where: {
              productId_locationId: {
                productId: line.productId,
                locationId: line.sourceLocationId,
              },
            },
          });
          if (currentStock) {
            await tx.stockLevel.update({
              where: {
                productId_locationId: {
                  productId: line.productId,
                  locationId: line.sourceLocationId,
                },
              },
              data: {
                reserved: Math.max(0, currentStock.reserved - line.quantity),
              },
            });
          }
        }
      }
    });

    revalidatePath("/operations/deliveries");
    revalidatePath("/stock");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to cancel delivery." };
  }
}

// ----------------------------------------------------
// 3. INTERNAL TRANSFERS
// ----------------------------------------------------

export async function createTransfer(data: {
  fromLocationId: string;
  toLocationId: string;
  scheduledAt?: string;
  notes?: string;
  lines: Array<{ productId: string; quantity: number }>;
}) {
  if (!data.fromLocationId || !data.toLocationId || !data.lines?.length) {
    return { error: "Source location, destination location, and items are required." };
  }
  if (data.fromLocationId === data.toLocationId) {
    return { error: "Source and destination locations cannot be identical." };
  }

  try {
    const fromLoc = await prisma.location.findUnique({
      where: { id: data.fromLocationId },
      include: { warehouse: true },
    });
    const whCode = fromLoc?.warehouse.shortCode || "WH";
    const count = await prisma.transfer.count();
    const reference = `${whCode}/TR/${String(count + 1).padStart(4, "0")}`;

    const transfer = await prisma.transfer.create({
      data: {
        reference,
        fromLocationId: data.fromLocationId,
        toLocationId: data.toLocationId,
        status: "DRAFT",
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        notes: data.notes || null,
        lines: {
          create: data.lines.map((l) => ({
            productId: l.productId,
            quantity: Math.max(1, Math.floor(l.quantity)),
          })),
        },
      },
    });

    revalidatePath("/operations/transfers");
    revalidatePath("/dashboard");
    return { success: true, transfer };
  } catch (err: any) {
    return { error: err.message || "Failed to create transfer." };
  }
}

export async function validateTransfer(transferId: string) {
  try {
    const transfer = await prisma.transfer.findUnique({
      where: { id: transferId },
      include: { lines: true },
    });

    if (!transfer) return { error: "Transfer not found." };
    if (transfer.status === "DONE") return { error: "Transfer already completed." };
    if (transfer.status === "CANCELLED") return { error: "Cannot validate cancelled transfer." };

    await prisma.$transaction(async (tx) => {
      // 1. Mark status DONE
      await tx.transfer.update({
        where: { id: transferId },
        data: { status: "DONE" },
      });

      // 2. Move quantities between locations
      for (const line of transfer.lines) {
        // Decrement source
        const srcStock = await tx.stockLevel.findUnique({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: transfer.fromLocationId,
            },
          },
        });
        const srcAfter = (srcStock?.quantity || 0) - line.quantity;
        await tx.stockLevel.upsert({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: transfer.fromLocationId,
            },
          },
          update: { quantity: srcAfter },
          create: {
            productId: line.productId,
            locationId: transfer.fromLocationId,
            quantity: srcAfter,
          },
        });

        // Increment destination
        const destStock = await tx.stockLevel.findUnique({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: transfer.toLocationId,
            },
          },
        });
        const destAfter = (destStock?.quantity || 0) + line.quantity;
        await tx.stockLevel.upsert({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: transfer.toLocationId,
            },
          },
          update: { quantity: destAfter },
          create: {
            productId: line.productId,
            locationId: transfer.toLocationId,
            quantity: destAfter,
          },
        });

        // Ledger: outbound from source
        await tx.stockLedger.create({
          data: {
            documentType: "TRANSFER",
            documentId: transfer.id,
            documentRef: transfer.reference,
            productId: line.productId,
            locationId: transfer.fromLocationId,
            quantityChange: -line.quantity,
            balanceAfter: srcAfter,
            notes: `Internal transfer out`,
          },
        });

        // Ledger: inbound to dest
        await tx.stockLedger.create({
          data: {
            documentType: "TRANSFER",
            documentId: transfer.id,
            documentRef: transfer.reference,
            productId: line.productId,
            locationId: transfer.toLocationId,
            quantityChange: line.quantity,
            balanceAfter: destAfter,
            notes: `Internal transfer in`,
          },
        });
      }
    });

    revalidatePath("/operations/transfers");
    revalidatePath("/products");
    revalidatePath("/stock");
    revalidatePath("/dashboard");
    revalidatePath("/operations/moves");

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to validate transfer." };
  }
}

export async function cancelTransfer(transferId: string) {
  try {
    const transfer = await prisma.transfer.findUnique({ where: { id: transferId } });
    if (!transfer) return { error: "Transfer not found." };
    if (transfer.status === "DONE") return { error: "Cannot cancel completed transfer." };

    await prisma.transfer.update({
      where: { id: transferId },
      data: { status: "CANCELLED" },
    });

    revalidatePath("/operations/transfers");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to cancel transfer." };
  }
}

// ----------------------------------------------------
// 4. INVENTORY ADJUSTMENTS
// ----------------------------------------------------

export async function createAdjustment(data: {
  locationId: string;
  notes?: string;
  lines: Array<{ productId: string; newQty: number }>;
}) {
  if (!data.locationId || !data.lines?.length) {
    return { error: "Location and adjusted item quantities are required." };
  }

  try {
    const loc = await prisma.location.findUnique({
      where: { id: data.locationId },
      include: { warehouse: true },
    });
    const whCode = loc?.warehouse.shortCode || "WH";
    const count = await prisma.adjustment.count();
    const reference = `${whCode}/ADJ/${String(count + 1).padStart(4, "0")}`;

    const adjustment = await prisma.$transaction(async (tx) => {
      const adj = await tx.adjustment.create({
        data: {
          reference,
          locationId: data.locationId,
          notes: data.notes || null,
        },
      });

      for (const line of data.lines) {
        const stock = await tx.stockLevel.findUnique({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: data.locationId,
            },
          },
        });

        const previousQty = stock?.quantity || 0;
        const newQty = Math.max(0, Math.floor(line.newQty));
        const diff = newQty - previousQty;

        await tx.adjustmentLine.create({
          data: {
            adjustmentId: adj.id,
            productId: line.productId,
            previousQty,
            newQty,
          },
        });

        await tx.stockLevel.upsert({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: data.locationId,
            },
          },
          update: { quantity: newQty },
          create: {
            productId: line.productId,
            locationId: data.locationId,
            quantity: newQty,
          },
        });

        await tx.stockLedger.create({
          data: {
            documentType: "ADJUSTMENT",
            documentId: adj.id,
            documentRef: adj.reference,
            productId: line.productId,
            locationId: data.locationId,
            quantityChange: diff,
            balanceAfter: newQty,
            notes: data.notes || "Physical inventory count adjustment",
          },
        });
      }

      return adj;
    });

    revalidatePath("/operations/adjustments");
    revalidatePath("/products");
    revalidatePath("/stock");
    revalidatePath("/dashboard");
    revalidatePath("/operations/moves");

    return { success: true, adjustment };
  } catch (err: any) {
    console.error("createAdjustment error:", err);
    return { error: err.message || "Failed to create adjustment." };
  }
}
