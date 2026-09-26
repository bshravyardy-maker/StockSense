import Link from "next/link";
import React from "react";

export default function PrivacyPage() {
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
            href="/terms"
            className="text-xs text-[#B9791F] hover:underline font-medium"
          >
            Terms & Conditions &rarr;
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
              Privacy Policy
            </h1>
            <p className="text-xs text-[#6B7280] mt-1">Plain-Language Summary &bull; Demo Build</p>
          </div>

          <div className="space-y-4 text-sm text-[#374151] leading-relaxed">
            <p>
              StockSense is an internal inventory and warehouse operations tool built for demonstration and evaluation. Because this is a self-contained demo build, there is <strong>no third-party email service connected</strong>; account recovery OTPs and system alerts are logged directly to the server console during testing rather than dispatched to external mail servers.
            </p>

            <p>
              We store only the operational data necessary to manage warehouse workflows: <strong>account information</strong> (your display name, login identifier, assigned role, and salted bcrypt password hashes) and <strong>inventory records</strong> (warehouse facilities, storage zones, product catalogs, SKU mappings, stock quantities, and immutable movement ledger entries).
            </p>

            <p>
              Your data is stored securely in our database and used exclusively to authenticate sessions and track warehouse movements. <strong>We do not sell, rent, monetize, or share your data or inventory records with any third parties or advertisers</strong>.
            </p>

            <p className="text-xs text-[#6B7280] pt-2 border-t border-[#EDEDEA]">
              As a demonstration environment, data may be reset periodically for testing. If you have questions regarding data storage or would like test accounts purged, contact your workspace administrator.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-[#DCDCD6] flex items-center justify-between text-xs text-[#6B7280]">
            <span>StockSense Demo Build &copy; {new Date().getFullYear()}</span>
            <div className="space-x-3">
              <Link href="/terms" className="text-[#B9791F] hover:underline font-medium">
                Terms of Service
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
