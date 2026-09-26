import Link from "next/link";

export default function TermsPage() {
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
              Terms of Service
            </h1>
            <p className="text-xs text-[#6B7280] mt-1">Last updated: {lastUpdated}</p>
          </div>

          <div className="prose prose-sm max-w-none text-[#1B1E24] space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-sm font-bold text-[#1B1E24] uppercase tracking-wider font-mono mb-2">
                1. What StockSense Is
              </h2>
              <p>
                StockSense is a warehouse and inventory operations tool that lets teams track stock levels, process inbound receipts, manage outbound deliveries, perform internal transfers between storage locations, and record physical count adjustments. It maintains an immutable audit ledger (StockLedger) of every stock movement.
              </p>
              <p className="mt-2">
                This application was built as a hackathon demonstration project. It is not a production commercial service.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-[#1B1E24] uppercase tracking-wider font-mono mb-2">
                2. Permitted Use
              </h2>
              <p>You may use StockSense to:</p>
              <ul className="list-disc list-inside space-y-1 mt-2 text-[#374151] ml-2">
                <li>Manage warehouse inventory data for your own organization or as a demonstration.</li>
                <li>Create and manage user accounts within the system for operational team members.</li>
                <li>Process stock movements (receipts, deliveries, transfers, adjustments) and inspect the audit trail.</li>
                <li>Evaluate the application for educational, demonstration, or hackathon review purposes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-sm font-bold text-[#1B1E24] uppercase tracking-wider font-mono mb-2">
                3. Prohibited Use
              </h2>
              <p>You may not:</p>
              <ul className="list-disc list-inside space-y-1 mt-2 text-[#374151] ml-2">
                <li>Store personally identifiable information beyond what is required to operate user accounts (name, login ID).</li>
                <li>Attempt to reverse-engineer, extract, or tamper with database records or session tokens.</li>
                <li>Use this application to manage regulated, classified, or legally sensitive inventory without appropriate compliance review.</li>
                <li>Create accounts on behalf of others without their knowledge or consent.</li>
                <li>Use automated scripts to submit fraudulent transactions or manipulate stock levels outside the provided interface.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-sm font-bold text-[#1B1E24] uppercase tracking-wider font-mono mb-2">
                4. Role-Based Access
              </h2>
              <p>
                StockSense enforces two operational roles:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2 text-[#374151] ml-2">
                <li>
                  <strong>MANAGER:</strong> Full access to all pages including warehouse and location configuration under Settings. Can create and validate all document types.
                </li>
                <li>
                  <strong>STAFF:</strong> Access to Products, Stock, and all Operations pages (Receipts, Deliveries, Transfers, Adjustments, Move History). Cannot access warehouse settings.
                </li>
              </ul>
              <p className="mt-2">
                Access controls are enforced server-side on every request. The Settings section is not visible to STAFF users in the navigation and will redirect to the dashboard if accessed directly.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-[#1B1E24] uppercase tracking-wider font-mono mb-2">
                5. Data Accuracy
              </h2>
              <p>
                StockSense records stock movements as entered by users. The system does not verify physical inventory counts against entered values. Users are responsible for the accuracy of data submitted through the application.
              </p>
              <p className="mt-2">
                Once a Receipt or Delivery Order is validated, the resulting StockLedger entries are permanent and cannot be deleted through the interface. Corrections must be applied through the Inventory Adjustment workflow.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-[#1B1E24] uppercase tracking-wider font-mono mb-2">
                6. No Warranty
              </h2>
              <p>
                This application is provided as-is for demonstration purposes. There are no warranties, express or implied, regarding uptime, data persistence, or fitness for any particular business purpose. The database may be reset or the service taken offline at any time.
              </p>
              <p className="mt-2">
                Do not use this application as the sole system of record for production inventory in a live business environment without independent data backups.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-[#1B1E24] uppercase tracking-wider font-mono mb-2">
                7. Limitation of Liability
              </h2>
              <p>
                The maintainers of this project accept no liability for stock discrepancies, lost inventory records, or business decisions made based on data displayed within StockSense. All use of the application is at the operator's own risk.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-bold text-[#1B1E24] uppercase tracking-wider font-mono mb-2">
                8. Modifications
              </h2>
              <p>
                These terms may be updated at any time. Continued use of the application after changes constitutes acceptance of the revised terms.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-[#DCDCD6] flex items-center justify-between text-xs text-[#6B7280]">
            <span>StockSense &copy; {new Date().getFullYear()}</span>
            <Link href="/privacy" className="text-[#B9791F] hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
