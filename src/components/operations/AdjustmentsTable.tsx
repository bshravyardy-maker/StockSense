import React from "react";

export interface AdjustmentItem {
  id: string;
  reference: string;
  locationName: string;
  warehouseCode: string;
  notes: string | null;
  createdAt: Date;
  lines: Array<{
    id: string;
    productName: string;
    productSku: string;
    previousQty: number;
    newQty: number;
    difference: number;
    unitAbbr: string;
  }>;
}

export function AdjustmentsTable({ adjustments }: { adjustments: AdjustmentItem[] }) {
  return (
    <div className="bg-white border border-[var(--color-line)] rounded-md shadow-2xs overflow-hidden">
      {adjustments.length === 0 ? (
        <div className="py-16 text-center text-xs text-[var(--color-muted)]">
          <p className="font-medium text-[var(--color-ink)] text-sm">No inventory adjustments recorded</p>
          <p className="mt-1">Record cycle counts or quantity fixes using the button above.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[var(--color-line)] text-[var(--color-muted)] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4">Line Variances</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {adjustments.map((a) => (
                <tr key={a.id} className="hover:bg-[#F9FAF9] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[var(--color-ink)]">
                    {a.reference}
                  </td>
                  <td className="py-3 px-4 text-[var(--color-ink)]">
                    <span>{a.locationName}</span>
                    <span className="ml-1 text-[10px] font-mono text-[var(--color-muted)] bg-[#EDEDEA] px-1 py-0.5 rounded">
                      {a.warehouseCode}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[var(--color-muted)] max-w-xs truncate">
                    {a.notes || "Count variance adjustment"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      {a.lines.map((l) => (
                        <div key={l.id} className="flex items-center space-x-2 text-[11px]">
                          <span className="font-medium text-[var(--color-ink)]">{l.productName}:</span>
                          <span className="font-mono text-[var(--color-muted)]">{l.previousQty} → {l.newQty}</span>
                          <span
                            className={`font-mono font-semibold px-1 py-0.2 rounded text-[10px] ${
                              l.difference > 0
                                ? "bg-[#E6F4EA] text-[#2E7D4F]"
                                : l.difference < 0
                                ? "bg-[#FCE8E6] text-[#B23A34]"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {l.difference > 0 ? `+${l.difference}` : l.difference}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[var(--color-muted)] font-mono">
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(a.createdAt))}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase border bg-[#FEF3D6] text-[#92400E] border-[#FCD34D]">
                      RECORDED
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
