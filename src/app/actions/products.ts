"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required").trim(),
  categoryId: z.string().min(1, "Category is required"),
  unitId: z.string().min(1, "Unit of measure is required"),
  unitCost: z.coerce.number().min(0, "Unit cost must be 0 or greater"),
  reorderPoint: z.coerce.number().int().min(0, "Reorder point must be 0 or greater"),
  reorderQty: z.coerce.number().int().min(0, "Reorder quantity must be 0 or greater"),
  description: z.string().optional(),
});

export type CreateProductState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createProduct(
  prevState: CreateProductState | null,
  formData: FormData
): Promise<CreateProductState> {
  const rawData = {
    name: formData.get("name"),
    sku: formData.get("sku"),
    categoryId: formData.get("categoryId"),
    unitId: formData.get("unitId"),
    unitCost: formData.get("unitCost"),
    reorderPoint: formData.get("reorderPoint"),
    reorderQty: formData.get("reorderQty"),
    description: formData.get("description"),
  };

  const parsed = productSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      error: "Validation failed. Please verify the input fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, sku, categoryId, unitId, unitCost, reorderPoint, reorderQty, description } =
    parsed.data;

  // Check unique SKU
  const existingProduct = await prisma.product.findUnique({
    where: { sku },
  });

  if (existingProduct) {
    return {
      error: `SKU "${sku}" is already in use. Please specify a unique SKU.`,
      fieldErrors: { sku: [`SKU "${sku}" is already registered`] },
    };
  }

  try {
    await prisma.product.create({
      data: {
        name,
        sku,
        categoryId,
        unitId,
        unitCost,
        reorderPoint,
        reorderQty,
        description: description ? description.trim() : null,
      },
    });

    revalidatePath("/products");
    revalidatePath("/stock");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: any) {
    console.error("Failed to create product:", err);
    return { error: "An unexpected error occurred while saving the product." };
  }
}
