import React from "react";

interface KPIData {
  totalInStock: number;
  lowStockCount: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  scheduledTransfers: number;
}

export function KPICards({ data }: { data: KPIData }) {
  const cards = [
    {
      title: "Total In Stock",
      value: data.totalInStock,
      subtitle: "Products with active inventory",
      indicatorColor: "bg-[var(--color-green)]",
      badgeText: "Active",
      badgeStyle: "bg-[#E6F4EA] text-[#2E7D4F] border border-[#A8DAB5]",
    },
    {
      title: "Low / Out of Stock",
      value: data.lowStockCount,
      subtitle: "At or below reorder threshold",
      indicatorColor: "bg-[var(--color-red)]",
      badgeText: data.lowStockCount > 0 ? "Action Required" : "Optimal",
      badgeStyle:
        data.lowStockCount > 0
          ? "bg-[#FCE8E6] text-[#B23A34] border border-[#F5C2BE]"
          : "bg-[#E6F4EA] text-[#2E7D4F] border border-[#A8DAB5]",
    },
    {
      title: "Pending Receipts",
      value: data.pendingReceipts,
      subtitle: "Inbound orders in READY status",
      indicatorColor: "bg-[var(--color-amber)]",
      badgeText: "Inbound",
      badgeStyle: "bg-[#FEF3D6] text-[#9A6214] border border-[#F9DE96]",
    },
    {
      title: "Pending Deliveries",
      value: data.pendingDeliveries,
      subtitle: "Orders in WAITING or READY",
      indicatorColor: "bg-[#3B82F6]",
      badgeText: "Outbound",
      badgeStyle: "bg-[#E8F0FE] text-[#1967D2] border border-[#AECBFA]",
    },
    {
      title: "Transfers Scheduled",
      value: data.scheduledTransfers,
      subtitle: "Internal moves in DRAFT",
      indicatorColor: "bg-[#6B7280]",
      badgeText: "Internal",
      badgeStyle: "bg-[#F1F3F4] text-[#5F6368] border border-[#DADCE0]",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white border border-[var(--color-line)] rounded-md p-4 flex flex-col justify-between shadow-2xs transition-shadow hover:shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)] font-mono">
              {card.title}
            </span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${card.badgeStyle}`}
            >
              {card.badgeText}
            </span>
          </div>

          <div className="my-1">
            <span className="text-3xl font-bold font-mono tracking-tight text-[var(--color-ink)]">
              {card.value}
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-[#F1F1EE] flex items-center space-x-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${card.indicatorColor}`} />
            <span className="text-[11px] text-[var(--color-muted)] truncate">
              {card.subtitle}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
