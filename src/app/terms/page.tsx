import Link from "next/link";
import React from "react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F4F4F2] px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-xs text-[#6B7280] hover:text-[#1B1E24] font-medium flex items-center space-x-1"
          >
            <span>&larr; Back to App</span>
          </Link>
          <Link
            href="/privacy"
            className="text-xs text-[#B9791F] hover:underline font-medium"
          >
            Privacy Policy &rarr;
          </Link>
        </div>

        <div className="bg-white border border-[#DCDCD6] rounded-md p-8 shadow-sm">
          <div className="mb-6 pb-4 border-b border-[#DCDCD6]">
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="w-7 h-7 rounded bg-[#1C2127] flex items-center justify-center text-white font-bold text-sm">
                S
              </div>
              <span className="font-semibold text-base text-[#1B1E24]">StockSense</span>
            </div>
            <h1 className="text-xl font-bold text-[#1B1E24] font-mono uppercase tracking-wide">
              Terms & Conditions
            </h1>
            <p className="text-xs text-[#6B7280] mt-1">Plain-Language Terms &bull; Demo Build</p>
          </div>

          <div className="space-y-4 text-sm text-[#374151] leading-relaxed">
            <p>
              StockSense is an internal warehouse operations tool designed to track products, process receipts and dispatch delivery orders, execute internal transfers, and log cycle count adjustments. This application is an <strong>evaluation and demonstration build</strong>. No commercial warranties are provided, and no external email service is integrated into this demo environment.
            </p>

            <p>
              By using this system, you agree to create accounts and enter inventory records strictly for legitimate testing or operational tracking. All stored inventory data, SKU catalogs, and user account records are used exclusively within the application and are <strong>never sold, marketed, or shared with third-party vendors</strong>.
            </p>

            <p>
              StockSense enforces strict role-based access control: <strong>MANAGER</strong> accounts configure warehouse facilities and settings, while <strong>STAFF</strong> accounts manage inventory movements. Validated warehouse transactions create permanent entries in the StockLedger audit trail to ensure inventory accountability.
            </p>

            <p className="text-xs text-[#6B7280] pt-2 border-t border-[#EDEDEA]">
              Because this is a demonstration environment, test databases and inventory counts may be periodically reset. Do not rely on this demo build as an irreplaceable single source of truth for regulated physical assets without offsite backups.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-[#DCDCD6] flex items-center justify-between text-xs text-[#6B7280]">
            <span>StockSense Demo Build &copy; {new Date().getFullYear()}</span>
            <div className="space-x-3">
              <Link href="/privacy" className="text-[#B9791F] hover:underline font-medium">
                Privacy Policy
              </Link>
              <span>&middot;</span>
              <Link href="/profile" className="hover:text-[#1B1E24]">
                My Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
