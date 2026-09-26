import type { Metadata } from "next";
import "./globals.css";

// Inline SVG favicon: anthracite background (#1C2127) with three amber (#B9791F) shelf/ledger bars
// representing warehouse racks. Wired via metadata, not /public, for explicit Next.js tracking.
const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='4' fill='%231C2127'/%3E%3Crect x='6' y='8' width='13' height='3' rx='1' fill='%23B9791F'/%3E%3Crect x='6' y='14' width='20' height='3' rx='1' fill='%23B9791F'/%3E%3Crect x='6' y='20' width='16' height='3' rx='1' fill='%23B9791F' opacity='0.65'/%3E%3C/svg%3E";

export const metadata: Metadata = {
  title: "StockSense: Warehouse Inventory Management",
  description: "Internal warehouse and inventory operations tool. Track stock, process receipts and deliveries, manage internal transfers, and audit every movement via the stock ledger.",
  icons: {
    icon: [{ url: FAVICON, type: "image/svg+xml" }],
    shortcut: FAVICON,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
