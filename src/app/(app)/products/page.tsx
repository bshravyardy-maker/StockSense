import { prisma } from "@/lib/prisma";
import { NewProductModal } from "@/components/products/NewProductModal";
import { ProductCategoryFilter } from "@/components/products/ProductCategoryFilter";
import React from "react";

interface PageProps {
  searchParams: Promise<{
    category?: string;
    q?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const categoryFilter = params.category || "";
  const searchQuery = params.q || "";

  // 1. Fetch metadata for filter and modal
  const [categories, units] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.unitOfMeasure.findMany({ orderBy: { name: "asc" } }),
  ]);

  // 2. Query products with stock levels and location details
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
        include: {
          location: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 mb-6 border-b border-[var(--color-line)] gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-anthracite)] font-mono uppercase">
            Product Master
          </h1>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            Active catalog items, reorder thresholds, and location allocations.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <ProductCategoryFilter categories={categories} />
          <NewProductModal categories={categories} units={units} />
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

      {/* Products Table */}
      <div className="bg-white border border-[var(--color-line)] rounded-md shadow-2xs overflow-hidden">
        {products.length === 0 ? (
          <div className="py-16 text-center text-xs text-[var(--color-muted)]">
            <svg
              className="mx-auto h-10 w-10 text-gray-300 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <p className="font-medium text-[var(--color-ink)] text-sm">No products found</p>
            <p className="mt-1">
              {searchQuery || categoryFilter
                ? "Try clearing filters or search term to see all inventory items."
                : "Register your first product using the button above."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[var(--color-line)] text-[var(--color-muted)] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4 text-right">Total Stock</th>
                  <th className="py-3 px-4 text-right">Reorder Point</th>
                  <th className="py-3 px-4">Location Breakdown</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {products.map((product) => {
                  const totalStock = product.stockLevels.reduce(
                    (acc, sl) => acc + sl.quantity,
                    0
                  );
                  const isLowStock = totalStock <= product.reorderPoint;
                  const activeLocations = product.stockLevels.filter(
                    (sl) => sl.quantity > 0
                  );

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-[#F9FAF9] transition-colors"
                    >
                      {/* Name */}
                      <td className="py-3 px-4 font-semibold text-[var(--color-ink)]">
                        <div>{product.name}</div>
                        {product.description && (
                          <div className="text-[11px] text-[var(--color-muted)] font-normal truncate max-w-xs">
                            {product.description}
                          </div>
                        )}
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-mono font-medium text-[var(--color-ink)]">
                        {product.sku}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-[var(--color-muted)]">
                        <span className="inline-block px-2 py-0.5 bg-[#F1F3F4] text-[#3C4043] rounded text-[11px] font-medium">
                          {product.category.name}
                        </span>
                      </td>

                      {/* Unit */}
                      <td className="py-3 px-4 text-[var(--color-muted)] font-mono">
                        {product.unit.abbreviation}
                      </td>

                      {/* Total Stock */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-[var(--color-ink)]">
                        {totalStock} {product.unit.abbreviation}
                      </td>

                      {/* Reorder Point */}
                      <td className="py-3 px-4 text-right font-mono text-[var(--color-muted)]">
                        {product.reorderPoint} {product.unit.abbreviation}
                      </td>

                      {/* Location Breakdown */}
                      <td className="py-3 px-4 text-[11px]">
                        {activeLocations.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-w-sm">
                            {activeLocations.map((loc) => (
                              <span
                                key={loc.id}
                                className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#F4F4F2] border border-[#DCDCD6] text-[10px] font-mono text-[var(--color-ink)]"
                              >
                                {loc.location.name}:{" "}
                                <strong className="ml-1 font-semibold">{loc.quantity}</strong>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[var(--color-muted)] italic">
                            No physical allocations
                          </span>
                        )}
                      </td>

                      {/* Low Stock Indicator */}
                      <td className="py-3 px-4 text-center">
                        {isLowStock ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-[#FCE8E6] text-[#B23A34] border border-[#F5C2BE]">
                            {totalStock === 0 ? "Out of Stock" : "Low Stock"}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-[#E6F4EA] text-[#2E7D4F] border border-[#A8DAB5]">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
