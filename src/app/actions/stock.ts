"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateStockLevelQuantity({
  productId,
  locationId,
  quantity,
}: {
  productId: string;
  locationId: string;
  quantity: number;
}) {
  if (isNaN(quantity) || quantity < 0) {
    return { error: "Quantity must be a positive number or zero." };
  }

  try {
    const updated = await prisma.stockLevel.upsert({
      where: {
        productId_locationId: {
          productId,
          locationId,
        },
      },
      update: {
        quantity: Math.floor(quantity),
      },
      create: {
        productId,
        locationId,
        quantity: Math.floor(quantity),
        reserved: 0,
      },
    });

    revalidatePath("/stock");
    revalidatePath("/products");
    revalidatePath("/dashboard");

    return { success: true, updated };
  } catch (err: any) {
    console.error("Failed to update stock quantity:", err);
    return { error: "Failed to update stock quantity. Please try again." };
  }
}
