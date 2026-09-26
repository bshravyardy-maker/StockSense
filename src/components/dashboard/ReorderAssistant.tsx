import React from "react";

export interface ReorderFlaggedProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  currentStock: number;
  reorderPoint: number;
  velocity: number; // units per day
  daysRemaining: number | null;
  suggestedReorder: number;
  reason: string;
}

interface ReorderAssistantProps {
  flaggedProducts: ReorderFlaggedProduct[];
}

export function ReorderAssistant({ flaggedProducts }: ReorderAssistantProps) {
  return (
    <div className="bg-[#FFFDF5] border border-[#E6B800]/50 rounded-md p-5 mb-8 shadow-xs">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F0D58C]">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded bg-[#B9791F] flex items-center justify-center text-white">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#664309] uppercase tracking-wide font-mono">
              Smart Reorder Assistant
            </h2>
            <p className="text-xs text-[#8A5B10]">
              Automated runout forecasting based on 14-day delivery velocity
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#F5E6B3] text-[#734C0A]">
            {flaggedProducts.length} {flaggedProducts.length === 1 ? "Item Flagged" : "Items Flagged"}
          </span>
        </div>
      </div>

      {flaggedProducts.length === 0 ? (
        <div className="py-6 text-center text-xs text-[#8A5B10] bg-[#FFF8E6] rounded border border-dashed border-[#E3CA84]">
          <p className="font-medium">No reorders currently required.</p>
          <p className="mt-1 text-[11px] text-[#A67524]">
            All inventory levels are above reorder thresholds, and consumption velocity indicates adequate stock.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#F0D58C] text-[#8A5B10] font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3 text-right">Current Stock</th>
                <th className="py-2.5 px-3 text-right">Reorder Point</th>
                <th className="py-2.5 px-3 text-right">14d Velocity</th>
                <th className="py-2.5 px-3 text-right">Est. Runout</th>
                <th className="py-2.5 px-3 text-right font-bold text-[#664309]">
                  Suggested Order
                </th>
                <th className="py-2.5 px-3 text-center">Trigger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7EAC4]">
              {flaggedProducts.map((item) => (
                <tr key={item.id} className="hover:bg-[#FFF3D6] transition-colors">
                  <td className="py-2.5 px-3 font-medium text-[var(--color-ink)]">
                    {item.name}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[var(--color-muted)]">
                    {item.sku}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium text-[var(--color-ink)]">
                    {item.currentStock} {item.unit}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-[var(--color-muted)]">
                    {item.reorderPoint} {item.unit}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-[var(--color-ink)]">
                    {item.velocity.toFixed(2)}/day
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {item.daysRemaining !== null ? (
                      <span
                        className={`font-semibold ${
                          item.daysRemaining < 3
                            ? "text-[#B23A34]"
                            : "text-[#B9791F]"
                        }`}
                      >
                        {item.daysRemaining} days
                      </span>
                    ) : (
                      <span className="text-[var(--color-muted)]">N/A</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-[#94580D]">
                    {item.suggestedReorder} {item.unit}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
                        item.reason.includes("Point")
                          ? "bg-[#FEE2E2] text-[#B23A34] border border-[#FCA5A5]"
                          : "bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]"
                      }`}
                    >
                      {item.reason}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
