import type { Metadata } from "next";
import "./globals.css";

// Inline SVG favicon: anthracite background (#1C2127) with 3D amber warehouse box/package icon
const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%231C2127'/%3E%3Cpath d='M16 5 L27 11.5 L16 18 L5 11.5 Z' fill='%23D98A24'/%3E%3Cpath d='M5 11.5 L16 18 L16 27 L5 20.5 Z' fill='%23B9791F'/%3E%3Cpath d='M27 11.5 L16 18 L16 27 L27 20.5 Z' fill='%238E5A11'/%3E%3Cpath d='M16 5 L16 18' stroke='%23FCE8C8' stroke-width='1.5' stroke-linecap='round'/%3E%3Cpath d='M16 18 L16 27' stroke='%23683F06' stroke-width='1' stroke-linecap='round'/%3E%3C/svg%3E";

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
