import Link from "next/link";

export default function PrivacyPage() {
  const lastUpdated = "September 26, 2025";

  return (
    <div className="min-h-screen bg-[#F4F4F2] px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href="/login"
            className="text-xs text-[#6B7280] hover:text-[#1B1E24] font-medium"
          >
            &larr; Back to login
          </Link>
        </div>

        <div className="bg-white border border-[#DCDCD6] rounded-md p-8 shadow-sm">
          <div className="mb-6 pb-5 border-b border-[#DCDCD6]">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-7 h-7 rounded bg-[#1C2127] flex items-center justify-center text-white font-bold text-sm">
                S
              </div>
              <span className="font-semibold text-[#1B1E24]">StockSense</span>
            </div>
            <h1 className="text-xl font-bold text-[#1B1E24] font-mono uppercase tracking-wide">
              Privacy Policy
            </h1>
            <p className="text-xs text-[#6B7280] mt-1">Last updated: {lastUpdated}</p>
          </div>

          <div className="prose prose-sm max-w-none text-[#1B1E24] space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-sm font-bold text-[#1B1E24] uppercase tracking-wider font-mono mb-2">
                1. About This Application
              </h2>
              <p>
                StockSense is an internal warehouse and inventory operations tool built as a hackathon demonstration project. It is not a commercial product and is not intended for use with sensitive personal data beyond what is strictly necessary to operate the system.
              </p>
              <p className="mt-2">
                This policy describes what data StockSense stores, how it is used, and what controls are in place.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-[#1B1E24] uppercase tracking-wider font-mono mb-2">
                2. Data We Store
              </h2>
              <p className="font-medium text-[#1B1E24] mb-2">User Accounts</p>
              <ul className="list-disc list-inside space-y-1 text-[#374151] ml-2">
                <li>Full name</li>
                <li>Login ID (email address or phone number)</li>
                <li>Hashed password (bcrypt, never stored in plain text)</li>
                <li>Role assignment (MANAGER or STAFF)</li>
                <li>Account creation timestamp</li>
              </ul>

              <p className="font-medium text-[#1B1E24] mt-4 mb-2">Inventory & Warehouse Data</p>
              <ul className="list-disc list-inside space-y-1 text-[#374151] ml-2">
                <li>Warehouse names, short codes, and physical addresses</li>
                <li>Storage location names within each warehouse</li>
                <li>Product catalog: names, SKUs, categories, units of measure, unit costs, reorder thresholds</li>
                <li>Stock levels per product per location (quantity on hand, reserved quantity)</li>
              </ul>

              <p className="font-medium text-[#1B1E24] mt-4 mb-2">Transaction Records</p>
              <ul className="list-disc list-inside space-y-1 text-[#374151] ml-2">
                <li>Inbound receipts: supplier name, destination location, product quantities, status, timestamps</li>
                <li>Delivery orders: destination address or customer reference, source locations, quantities, status</li>
                <li>Internal transfers: source and destination locations, quantities, status</li>
                <li>Inventory adjustments: location, previous and new quantities, adjustment notes</li>
                <li>StockLedger audit trail: immutable record of every quantity change, linked to the document that caused it, signed quantity delta, and balance after each movement</li>
              </ul>

              <p className="font-medium text-[#1B1E24] mt-4 mb-2">Password Reset Records</p>
              <ul className="list-disc list-inside space-y-1 text-[#374151] ml-2">
                <li>Time-limited OTP codes (6-digit, expire after 15 minutes)</li>
                <li>Reset request timestamps and usage state</li>
              </ul>
            </section>

            <section>
              <h2 className="text-sm font-bold text-[#1B1E24] uppercase tracking-wider font-mono mb-2">
                3. How Data Is Used
              </h2>
              <p>
                All data stored by StockSense is used solely to operate the inventory management system. Specifically:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2 text-[#374151] ml-2">
                <li>User account data authenticates sessions and controls access by role.</li>
                <li>Warehouse and product data drives the operational dashboard, stock views, and reorder forecasting.</li>
                <li>Transaction records and the StockLedger provide an audit trail for all stock movements.</li>
                <li>No data is sold, shared with third parties, or used for advertising.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-sm font-bold text-[#1B1E24] uppercase tracking-wider font-mono mb-2">
                4. Data Storage & Security
              </h2>
              <p>
                Data is stored in a PostgreSQL database hosted on Supabase (AWS ap-northeast-1 region). The application connects via a PgBouncer transaction-mode pooler for runtime queries and a direct connection for schema migrations.
              </p>
              <p className="mt-2">
                Passwords are hashed using bcrypt with a cost factor of 10. Session tokens are JWT-signed using a server-side secret and never stored in the database.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-[#1B1E24] uppercase tracking-wider font-mono mb-2">
                5. Hackathon Demo Scope
              </h2>
              <p>
                StockSense was built as a demonstration project for a hackathon. The application contains demo seed data (sample warehouses, products, and a demo user account) for evaluation purposes. This demo data is fictional and does not represent any real organization, supplier, or inventory.
              </p>
              <p className="mt-2">
                As a demo application, there is no formal data retention schedule. The database may be reset or cleared at any time.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-[#1B1E24] uppercase tracking-wider font-mono mb-2">
                6. Your Rights
              </h2>
              <p>
                Users can request deletion of their account and associated data by contacting the application operator. Because this is a closed internal tool, there is no public data removal form.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-[#1B1E24] uppercase tracking-wider font-mono mb-2">
                7. Contact
              </h2>
              <p>
                This application was submitted as a hackathon project. For any questions about data handling, contact the project maintainer via the hackathon submission channel.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-[#DCDCD6] flex items-center justify-between text-xs text-[#6B7280]">
            <span>StockSense &copy; {new Date().getFullYear()}</span>
            <Link href="/terms" className="text-[#B9791F] hover:underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
