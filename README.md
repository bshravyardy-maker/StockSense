# StockSense

**Warehouse inventory management built for the Odoo Hackathon.**

StockSense replaces scattered spreadsheets, manual stock registers, and disconnected tools with a single web interface for tracking stock levels, processing warehouse documents, and maintaining an immutable audit trail of every stock movement.

---

## Live Demo

> **Deployed URL:** _(Add your Vercel URL here once confirmed)_

**Demo credentials — seeded by `prisma/seed.ts`:**

| Role | Login | Password |
|------|-------|----------|
| Manager | `manager@stocksense.demo` | `Demo1234!` |
| Staff | `staff@stocksense.demo` | `Demo1234!` |

The Manager account has full access including warehouse settings. The Staff account has access to all operational pages but the Settings section is fully hidden (not just disabled).

---

## What It Does

StockSense covers the core warehouse operations loop:

- **Dashboard** — 5 live KPI cards (products in stock, low-stock count, pending receipts, pending deliveries, scheduled transfers), filterable by document type, status, warehouse, and category. Includes the Smart Reorder Assistant and a cross-type recent documents table.
- **Products** — Product catalog with SKU, category, unit of measure, unit cost, and reorder thresholds. Global search by name or SKU. New product creation with duplicate-SKU validation.
- **Stock** — On-hand quantity and free-to-use quantity (on-hand minus reserved) per product per location. Inline quantity editing — click any on-hand cell to enter an override directly.
- **Receipts** — Inbound stock from suppliers. Document lifecycle: Draft → Ready → Done (or Cancelled). Validating a receipt increments stock levels atomically and writes a `RECEIPT` entry to the StockLedger.
- **Delivery Orders** — Outbound stock dispatches. Lifecycle: Draft → Waiting → Ready → Done (or Cancelled). Validation decrements stock and releases reservations atomically. Writes a `DELIVERY` entry to the StockLedger.
- **Internal Transfers** — Move stock between locations in the same or different warehouses. Lifecycle: Draft → Done (or Cancelled). Writes two ledger entries (source negative, destination positive).
- **Inventory Adjustments** — Manual count corrections. Records previous and new quantities per line. Writes an `ADJUSTMENT` entry with the signed delta.
- **Move History** — Full StockLedger view with color-coded rows (green for inbound, red for outbound/negative) and signed quantity deltas.
- **Warehouse Settings** _(Manager only)_ — Create warehouses and storage locations. Fully hidden in the sidebar and redirect-protected for Staff.
- **Profile** — User credentials, role, account creation date, and sign-out.

---

## Smart Reorder Assistant

The standout feature of StockSense. Located prominently on the dashboard, it automatically flags products that need replenishment based on two independent triggers, computed directly from real transaction data:

**Trigger 1 — Below Reorder Point:**
```
currentStock <= product.reorderPoint
```

**Trigger 2 — Velocity-Based Runout < 7 Days:**
```
velocity = totalUnitsDelivered (last 14 days) / 14          # units/day
daysRemaining = currentStock / velocity
flag if daysRemaining < 7
```

**Suggested Order Quantity** (whichever is larger):
```
suggestedReorder = max(product.reorderQty, ceil(velocity * 21))
```
The `velocity * 21` term covers 3 weeks of projected consumption. Using `max()` ensures the catalog reorder quantity is always the floor.

Velocity is computed live from `StockLedger` entries with `documentType = DELIVERY` and `quantityChange < 0` in the last 14 days. If a product has had no outbound deliveries, velocity is 0 and the runout trigger does not fire (only the reorder-point trigger applies).

---

## Tech Stack

Sourced from [`package.json`](./package.json):

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | `^15.0.3` |
| UI | React | `^19.0.0` |
| Styling | Tailwind CSS v4 | `^4.0.0` |
| Auth | NextAuth.js | `5.0.0-beta.25` |
| ORM | Prisma | `^5.20.0` |
| Database | PostgreSQL (Supabase) | — |
| Validation | Zod | `^3.23.8` |
| Password hashing | bcryptjs | `^2.4.3` |
| TypeScript | — | `^5.6.0` |
| Script runner | tsx | `^4.16.0` |

> **Note on Tailwind v4:** There is no `tailwind.config.js`. Configuration is CSS-only via `src/app/globals.css` with `@import "tailwindcss"`.

---

## Data Model

Sourced from [`prisma/schema.prisma`](./prisma/schema.prisma):

```
User            — login (email or phone), name, bcrypt hash, role (MANAGER | STAFF)
PasswordReset   — time-limited 6-digit OTP codes for password recovery
Warehouse       — name, short code, optional address
Location        — named slot within a warehouse (e.g., "Rack A", "Line 1")
Category        — product category label
UnitOfMeasure   — e.g., kg, unit
Product         — name, SKU (unique), category, unit, unit cost, reorder point, reorder qty
StockLevel      — quantity on hand + reserved per (product, location) pair
Supplier        — name, contact email, phone
Receipt         — inbound document with lines (product + qty), lifecycle status
DeliveryOrder   — outbound document with lines (product + source location + qty), lifecycle status
Transfer        — internal move with lines (product + qty), from/to locations
Adjustment      — manual count correction with previous and new qty per line
StockLedger     — immutable audit log of every stock change: documentType, documentRef,
                  productId, locationId, quantityChange (signed), balanceAfter
```

`StockLedger` has a composite index on `(productId, createdAt)` for efficient velocity queries.

---

## Setup

### Prerequisites

- Node.js 18+
- A PostgreSQL database (Supabase recommended — the pooler connection strings are pre-wired)

### 1. Clone and install

```bash
git clone <repo-url>
cd StockSense
npm install
# Runs `prisma generate` automatically via postinstall
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in your real values:

```bash
cp .env.example .env
```

Required variables (from [`.env.example`](./.env.example)):

```env
# Supabase pooled connection — transaction mode, port 6543, pgbouncer=true required
DATABASE_URL="postgresql://..."

# Supabase direct connection — used only for migrations, port 5432
DIRECT_URL="postgresql://..."

# NextAuth session signing secret — generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-random-32-plus-char-secret-here"
```

> `DATABASE_URL` **must** include `?pgbouncer=true` when using Supabase's transaction-mode pooler. Without it, prepared statements will fail.

### 3. Migrate the database

```bash
npm run db:migrate
# Runs: prisma migrate dev
```

For production deployments, use `prisma migrate deploy` instead.

### 4. Seed demo data

```bash
npm run db:seed
# Runs: tsx prisma/seed.ts
```

Seeds: 4 categories, 2 UoMs (kg, unit), 2 demo users, 2 warehouses, 3 locations, 6 products, stock levels for each, and 1 demo supplier (Acme Steel Co.).

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

From [`package.json`](./package.json):

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint check |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run db:seed` | Seed demo data via `tsx prisma/seed.ts` |

---

## Deployment (Vercel + Supabase)

1. Push to GitHub and import the repo in [vercel.com](https://vercel.com).
2. Set the three environment variables in Vercel's project settings: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`.
3. Add a build command override if needed, or let Vercel use the default `next build`.
4. After first deploy, run migrations against the live database:
   ```bash
   DATABASE_URL="..." DIRECT_URL="..." npx prisma migrate deploy
   npx prisma db seed
   ```
5. Confirm the deployment loads, KPIs return live data, and receipts/deliveries write to the StockLedger.

> Supabase free-tier databases may experience a 1–2 second cold start on the first query after a period of inactivity. This is expected behavior with the connection pooler.

---

## Project Structure

```
src/
  app/
    (app)/              # Authenticated route group (no URL prefix)
      dashboard/        # Operations dashboard + KPIs + Reorder Assistant
      products/         # Product catalog
      stock/            # Stock levels snapshot
      operations/
        receipts/       # Inbound receipts
        deliveries/     # Outbound delivery orders
        transfers/      # Internal location transfers
        adjustments/    # Manual count adjustments
        moves/          # Move history (StockLedger view)
      settings/
        warehouses/     # Warehouse + location management (MANAGER only)
      profile/          # User profile + sign-out
    (auth)/             # Public auth pages
      login/
      signup/
      reset-password/
    privacy/            # Privacy Policy (public, no auth required)
    terms/              # Terms of Service (public, no auth required)
    actions/            # All Server Actions (products, stock, operations, settings, auth)
  components/
    dashboard/          # KPICards, DashboardFilterBar, ReorderAssistant, RecentDocumentsTable
    layout/             # Sidebar, TopBar
    operations/         # Modal + table components for each operation type
    products/           # NewProductModal, ProductCategoryFilter
    settings/           # NewWarehouseModal
    stock/              # StockTable
    ui/                 # AuthCard, Button, Input (shared primitives)
  lib/
    prisma.ts           # Prisma client singleton
  auth.ts               # NextAuth config (JWT, bcrypt credential provider)
  middleware.ts         # Route protection, PUBLIC_PATHS list
prisma/
  schema.prisma
  seed.ts
```

---

## Design System

All palette values are CSS custom properties in [`src/app/globals.css`](./src/app/globals.css):

| Token | Value | Usage |
|-------|-------|-------|
| `--color-anthracite` | `#1C2127` | Sidebar, primary surfaces |
| `--color-amber` | `#B9791F` | Accent, CTAs, active states |
| `--color-green` | `#2E7D4F` | Success, positive stock delta |
| `--color-red` | `#B23A34` | Danger, low stock, negative delta |
| `--color-bg` | `#F4F4F2` | Page background |
| `--color-ink` | `#1B1E24` | Primary text |
| `--color-muted` | `#6B7280` | Secondary text |
| `--color-line` | `#DCDCD6` | Borders and dividers |

Design constraints enforced throughout: no purple, no gradients, no `rounded-full` on interactive elements (max `rounded-md`), no fake metrics.
