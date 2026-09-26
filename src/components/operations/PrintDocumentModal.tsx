"use client";

import React from "react";

export interface PrintableDocumentData {
  type: "RECEIPT" | "DELIVERY" | "TRANSFER" | "ADJUSTMENT";
  reference: string;
  status: string;
  date: Date | string;
  partnerOrLocation?: string;
  details?: Array<{ label: string; value: string }>;
  lines: Array<{
    id?: string;
    productName: string;
    productSku: string;
    quantity?: number;
    unitAbbr: string;
    previousQty?: number;
    newQty?: number;
    difference?: number;
    sourceLocation?: string;
  }>;
  notes?: string | null;
}

interface PrintDocumentModalProps {
  document: PrintableDocumentData | null;
  onClose: () => void;
}

export function PrintDocumentModal({
  document,
  onClose,
}: PrintDocumentModalProps) {
  if (!document) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(document.date));

  const getDocTitle = () => {
    switch (document.type) {
      case "RECEIPT":
        return "Goods Receipt Slip";
      case "DELIVERY":
        return "Outbound Delivery Note";
      case "TRANSFER":
        return "Internal Transfer Slip";
      case "ADJUSTMENT":
        return "Inventory Adjustment Voucher";
      default:
        return "Warehouse Document";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full border border-[var(--color-line)] overflow-hidden my-8">
        {/* On-screen control bar (Hidden during print) */}
        <div className="no-print px-6 py-3.5 bg-[#1C2127] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg
              className="w-4 h-4 text-[var(--color-amber)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            <span className="text-xs font-semibold font-mono tracking-wide uppercase">
              Print Preview
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[var(--color-amber)] hover:bg-[#A36718] text-white rounded text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 bg-[#2B323D] hover:bg-[#3C4654] text-gray-300 rounded text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div id="printable-document-content" className="p-8 text-[#1B1E24] bg-white">
          {/* Header */}
          <div className="border-b-2 border-[#1C2127] pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-7 h-7 rounded bg-[#1C2127] flex items-center justify-center text-white font-bold text-sm">
                    S
                  </div>
                  <span className="font-bold text-base tracking-tight text-[#1C2127]">StockSense Operations</span>
                </div>
                <h1 className="text-xl font-extrabold uppercase tracking-wide font-mono text-[#1C2127]">
                  {getDocTitle()}
                </h1>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider bg-[#E6F4EA] text-[#2E7D4F] border border-[#A8DAB5]">
                  {document.status}
                </span>
                <p className="text-xs font-mono text-[#6B7280] mt-1.5">{formattedDate}</p>
              </div>
            </div>
          </div>

          {/* Document Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 bg-[#F8F9FA] border border-[#DCDCD6] rounded p-4 mb-6 text-xs">
            <div>
              <span className="text-[#6B7280] uppercase font-mono text-[10px] tracking-wider block">
                Document Reference
              </span>
              <span className="font-mono font-bold text-sm text-[#1B1E24]">
                {document.reference}
              </span>
            </div>
            <div>
              <span className="text-[#6B7280] uppercase font-mono text-[10px] tracking-wider block">
                Document Type
              </span>
              <span className="font-semibold text-xs text-[#1B1E24]">
                {document.type}
              </span>
            </div>

            {document.details && document.details.map((detail, idx) => (
              <div key={idx}>
                <span className="text-[#6B7280] uppercase font-mono text-[10px] tracking-wider block">
                  {detail.label}
                </span>
                <span className="font-semibold text-xs text-[#1B1E24]">
                  {detail.value}
                </span>
              </div>
            ))}

            {document.notes && (
              <div className="col-span-2 pt-2 border-t border-[#EDEDEA]">
                <span className="text-[#6B7280] uppercase font-mono text-[10px] tracking-wider block">
                  Notes / Instructions
                </span>
                <span className="text-xs text-[#374151]">
                  {document.notes}
                </span>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-[#6B7280] mb-2">
              Itemized Stock Lines
            </h3>
            <table className="w-full text-xs border border-[#DCDCD6] border-collapse">
              <thead>
                <tr className="bg-[#F4F4F2] border-b border-[#DCDCD6] font-semibold text-[#374151]">
                  <th className="py-2.5 px-3 text-left">#</th>
                  <th className="py-2.5 px-3 text-left">Product Name</th>
                  <th className="py-2.5 px-3 text-left font-mono">SKU</th>
                  {document.type === "ADJUSTMENT" ? (
                    <>
                      <th className="py-2.5 px-3 text-right">Previous</th>
                      <th className="py-2.5 px-3 text-right">Adjusted</th>
                      <th className="py-2.5 px-3 text-right">Variance</th>
                    </>
                  ) : (
                    <>
                      {document.type === "DELIVERY" && (
                        <th className="py-2.5 px-3 text-left">Source Location</th>
                      )}
                      <th className="py-2.5 px-3 text-right">Quantity</th>
                      <th className="py-2.5 px-3 text-left">Unit</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {document.lines.map((line, index) => (
                  <tr key={line.id || index} className="text-[#1F2937]">
                    <td className="py-2 px-3 font-mono text-[#6B7280]">{index + 1}</td>
                    <td className="py-2 px-3 font-medium">{line.productName}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-[#4B5563]">{line.productSku}</td>
                    {document.type === "ADJUSTMENT" ? (
                      <>
                        <td className="py-2 px-3 text-right font-mono text-[#6B7280]">
                          {line.previousQty} {line.unitAbbr}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          {line.newQty} {line.unitAbbr}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold">
                          {(line.difference ?? 0) > 0 ? `+${line.difference}` : line.difference} {line.unitAbbr}
                        </td>
                      </>
                    ) : (
                      <>
                        {document.type === "DELIVERY" && (
                          <td className="py-2 px-3 text-left text-[11px] text-[#4B5563]">
                            {line.sourceLocation || "Warehouse"}
                          </td>
                        )}
                        <td className="py-2 px-3 text-right font-mono font-bold text-sm">
                          {line.quantity}
                        </td>
                        <td className="py-2 px-3 text-left font-mono text-[#6B7280]">
                          {line.unitAbbr}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Verification & Signatures */}
          <div className="border-t border-[#DCDCD6] pt-6 mt-8">
            <div className="grid grid-cols-2 gap-8 text-xs text-[#374151]">
              <div>
                <p className="font-semibold mb-6">Prepared / Handled By:</p>
                <div className="border-b border-dashed border-[#9CA3AF] pb-1 flex justify-between font-mono text-[11px] text-[#6B7280]">
                  <span>Authorized Signature</span>
                  <span>Date</span>
                </div>
              </div>
              <div>
                <p className="font-semibold mb-6">Verified / Confirmed By:</p>
                <div className="border-b border-dashed border-[#9CA3AF] pb-1 flex justify-between font-mono text-[11px] text-[#6B7280]">
                  <span>Receiver / Inspector Signature</span>
                  <span>Date</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-[#9CA3AF] font-mono text-center mt-6">
              Generated by StockSense &bull; Immutable Warehouse Audit Record
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
