# FarmSight 360 — Farmer, Workforce & Marketplace Frontend (`farm360_frontend`)

The `farm360_frontend` application (`:5173` dev / `:80` via Caddy) is the primary React 18 + Vite + Tailwind CSS web application for farmers, farm managers, and service providers.

---

## 🌟 Key Capabilities

1. **Multi-Farm Context & Identity**:
   - Switch between multiple farms seamlessly from the header selector; all crops, inventory, workers, bookings, and finances automatically scope to `(user_id, farm_id)`.
2. **Crops, Duplicate Crop Detection & Multi-Harvest Grading (`CropsPage.jsx`)**:
   - **Case-Insensitive Duplicate Crop Prompt**: Planting a crop that already exists on the active farm (e.g., `Tomato` vs `tomato`) triggers a modal offering to either **Discard** or **Append to Existing Crop** (automatically adding the new acreage and logging planting material usage against the existing crop).
   - Supports seasonal & perennial crops, weight (`kg`, `quintal`, `ton`) and count (`pieces`, `count`, `nos`) harvest units, grade segregation (`Grade A/B/C/Reject`), and sales tracking.
3. **Shared Workforce Directory, Attendance & Payroll (`WorkersPage.jsx`)**:
   - **Shareable Worker IDs (`W-...`) & Location**: Every worker card displays its universal `worker_code` badge and location.
   - **Two-Tab Add / Link Worker Modal**:
     - **➕ Create New Worker**: Registers a new worker and automatically detects duplicate phone numbers (`409 WORKER_EXISTS`), offering a one-click **Link to This Farm** prompt.
     - **🔗 Find & Link Shared Worker**: Searches the cross-farm shared worker directory (`GET /workers/directory`) by **Phone**, **Worker ID (`W-...`)**, or **Location**, and links the worker to the current farm (`POST /workers/link`) with a farm-specific **Role** and **Daily Wage**.
   - **Attendance Calendar & Settlement Lock**: Persists selected attendance month across reloads and locks attendance cells on or before a worker's `last_payout_date`.
4. **Inventory, Crop Care & Unified Finance (`InventoryPage.jsx`, `FinancePage.jsx`)**:
   - Stock purchases, crop care applications, low-stock alerts, and unified P&L combining crop revenue, inventory expenses, worker payouts, and synced Service Provider invoices.
5. **Service Provider Marketplace & Portal (`/sp/*`)**:
   - Browse providers, book teams/individuals for a specific farm, review itemized invoices, and pay via Cash or Razorpay/UPI.

---

## ⚙️ Environment Variables (`.env`)

When served behind Caddy (`http://localhost`), leave the `VITE_*_URL` variables empty (`""`) so all API calls use relative paths on the same origin. When running Vite standalone without Caddy, point them to localhost ports:

```env
VITE_AUTH_SERVICE_URL=http://localhost:4000
VITE_FARM_SERVICE_URL=http://localhost:4001
VITE_WORKER_SERVICE_URL=http://localhost:4002
VITE_SP_SERVICE_URL=http://localhost:4003
```

---

## 🚀 Setup & Running Guide (Standalone vs. Docker)

### Option A: Standalone (Native Local / EC2)
```bash
cd farm360_frontend
npm install
npm run dev
```
- **Direct Vite URL**: `http://localhost:5173`
- **Via Caddy Reverse Proxy**: `http://localhost` (`:80`)

### Option B: Docker Environment
`farm360_frontend/Dockerfile` uses a multi-stage build (`node:20-alpine` build stage → `nginx:1.27-alpine` static SPA server on port `80`, proxied by Caddy).
```bash
# From workspace root
docker compose up -d --build frontend caddy
```
