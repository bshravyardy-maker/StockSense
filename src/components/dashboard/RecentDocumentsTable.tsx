import React from "react";

export interface DashboardDocument {
  id: string;
  type: "RECEIPT" | "DELIVERY" | "TRANSFER" | "ADJUSTMENT";
  reference: string;
  locationInfo?: string;
  status: string;
  date: Date;
}

interface RecentDocumentsTableProps {
  documents: DashboardDocument[];
  totalCount?: number;
}

export function RecentDocumentsTable({ documents, totalCount }: RecentDocumentsTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "DONE":
      case "RECORDED":
        return "bg-[#E6F4EA] text-[#2E7D4F] border-[#A8DAB5]";
      case "READY":
        return "bg-[#FEF3D6] text-[#9A6214] border-[#F9DE96]";
      case "WAITING":
        return "bg-[#E8F0FE] text-[#1967D2] border-[#AECBFA]";
      case "DRAFT":
        return "bg-[#F1F3F4] text-[#5F6368] border-[#DADCE0]";
      case "CANCELLED":
        return "bg-[#FCE8E6] text-[#B23A34] border-[#F5C2BE]";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "RECEIPT":
        return "bg-[#E6F4EA] text-[#2E7D4F]";
      case "DELIVERY":
        return "bg-[#E8F0FE] text-[#1967D2]";
      case "TRANSFER":
        return "bg-[#F3E8FD] text-[#6B21A8]";
      case "ADJUSTMENT":
        return "bg-[#FEF3D6] text-[#92400E]";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const countLabel =
    documents.length === 0
      ? "0 documents shown"
      : totalCount && totalCount > documents.length
      ? `${documents.length} of ${totalCount} shown`
      : `${documents.length} document${documents.length === 1 ? "" : "s"} shown`;

  return (
    <div className="bg-white border border-[var(--color-line)] rounded-md shadow-2xs overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-line)] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-ink)] font-mono uppercase tracking-wide">
            Recent Warehouse Documents
          </h3>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            Latest receipts, deliveries, transfers, and adjustments
          </p>
        </div>
        <span className="text-xs font-mono text-[var(--color-muted)]">
          {countLabel}
        </span>
      </div>

      {documents.length === 0 ? (
        <div className="py-12 text-center text-xs text-[var(--color-muted)]">
          <svg
            className="mx-auto h-8 w-8 text-gray-400 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="font-medium text-[var(--color-ink)]">No documents recorded yet</p>
          <p className="mt-1">
            Receipts, delivery orders, transfers, and adjustments will appear here once processed.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[var(--color-line)] text-[var(--color-muted)] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Location / Target</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {documents.map((doc) => (
                <tr key={`${doc.type}-${doc.id}`} className="hover:bg-[#F8F9FA] transition-colors">
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase ${getTypeBadge(
                        doc.type
                      )}`}
                    >
                      {doc.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-[var(--color-ink)]">
                    {doc.reference}
                  </td>
                  <td className="py-3 px-4 text-[var(--color-muted)]">
                    {doc.locationInfo || "General Warehouse"}
                  </td>
                  <td className="py-3 px-4 text-[var(--color-muted)] font-mono">
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(doc.date))}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase border ${getStatusBadge(
                        doc.status
                      )}`}
                    >
                      {doc.status}
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
