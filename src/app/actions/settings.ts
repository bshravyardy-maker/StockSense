"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createWarehouse(data: {
  name: string;
  shortCode: string;
  address?: string;
}) {
  const session = await auth();
  if ((session?.user as any)?.role !== "MANAGER") {
    return { error: "Unauthorized. MANAGER role required." };
  }

  if (!data.name || !data.shortCode) {
    return { error: "Warehouse name and short code are required." };
  }

  try {
    const existing = await prisma.warehouse.findUnique({
      where: { shortCode: data.shortCode.toUpperCase().trim() },
    });
    if (existing) {
      return { error: `Warehouse with code "${data.shortCode}" already exists.` };
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name: data.name.trim(),
        shortCode: data.shortCode.toUpperCase().trim(),
        address: data.address ? data.address.trim() : null,
      },
    });

    revalidatePath("/settings/warehouses");
    revalidatePath("/dashboard");
    return { success: true, warehouse };
  } catch (err: any) {
    return { error: err.message || "Failed to create warehouse." };
  }
}

export async function createLocation(data: {
  warehouseId: string;
  name: string;
  shortCode: string;
}) {
  const session = await auth();
  if ((session?.user as any)?.role !== "MANAGER") {
    return { error: "Unauthorized. MANAGER role required." };
  }

  if (!data.warehouseId || !data.name || !data.shortCode) {
    return { error: "Warehouse, location name, and short code are required." };
  }

  try {
    const location = await prisma.location.create({
      data: {
        warehouseId: data.warehouseId,
        name: data.name.trim(),
        shortCode: data.shortCode.toUpperCase().trim(),
      },
    });

    revalidatePath("/settings/warehouses");
    revalidatePath("/stock");
    revalidatePath("/products");
    return { success: true, location };
  } catch (err: any) {
    return { error: err.message || "Failed to create location." };
  }
}
