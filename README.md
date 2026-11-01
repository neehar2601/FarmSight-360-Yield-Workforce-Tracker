# FarmSight 360 — Farmer & Workforce Frontend Application

The `farm360_frontend` application is the primary client-facing web application for the **FarmSight 360** ecosystem. Built with React 18 and Vite, it delivers an intuitive, responsive, and data-dense interface designed for agricultural producers, farm managers, and service providers.

---

## 🌟 Application Capabilities

### 1. Multi-Farm & Identity Management
- **Seamless Farm Switching**: Switch context between multiple agricultural holdings from the global farm selector.
- **Role-Aware Navigation**: Adaptive menus for farm owners, operators, and service providers.
- **Profile & Security Settings**: Manage user credentials, update avatar pictures, reset passwords with OTP, and configure farm metadata.

### 2. Crops & Harvest Lifecycle
- **Multi-Harvest Tracking**: Record sequential harvest batches across the same crop cycle.
- **Batch Grading & Segregation**: Record harvests as raw/unsegregated or segregated into distinct commercial quality grades (Grade A, Grade B, Grade C, Commercial/Reject).
- **Yield Analytics**: Visualise yield per acre, harvest dates, and total crop production metrics.

### 3. Workforce Management & Attendance
- **Worker Roster**: Register daily wage or monthly salaried farm workers.
- **Interactive Attendance Grid**: Mark attendance (`Present`, `Absent`, `Half-Day`, `Overtime`) across daily and monthly calendar views.
- **Payroll & Loan Settlements**: Record cash advances, loan disbursements, salary accruals, bonuses, and weekly/monthly payout settlements with PDF wage slips.

### 4. Crop Care & Application Ledger
- **Fertilisers & Sprays Schedule**: Track application dates, target crop blocks, application methods, and active dosages.
- **Inventory Stock Deduction**: Directly link applications to existing inventory items, automatically decrementing available stock and recording the operation in the farm ledger.
- **Mobile-Optimized Form**: High-contrast, responsive inputs that remain clearly visible and unmasked on small screen sizes.

### 5. Inventory & Supply Chain
- **Categorized Inventory**: Manage stock across 9 agricultural categories (Fertilisers, Pesticides & Sprays, Seeds, Equipment, Packaging, Fuel, Irrigation, Veterinary, Animal Feed).
- **Threshold Alerts**: Visual alerts when stock dips below safe operational minimums.
- **Stock Movements**: Full audit log of all Purchases (`Buy`), Applications (`Use`), and Reductions (`Sell`/`Waste`).

### 6. Farm Finance & P&L Analytics
- **Comprehensive General Ledger**: Aggregate income from crop sales against expenses from inventory purchases, workforce wages, equipment maintenance, and marketplace services.
- **Automated Service Provider Expense Sync**: Service provider job payments appear automatically as verified operational expenses.
- **Visual Analytics**: Interactive financial breakdown charts, cash flow projections, and monthly profitability summaries.

### 7. Service Provider Marketplace & Booking Portal
- **Service Catalog**: Browse vetted agricultural service providers (harvesters, drone sprayers, tractor operators, pruning teams).
- **Flexible Booking Engine**: Book services priced flat-rate, per-day, per-tree/plant, per-hour, or per-acre.
- **Workforce Capacity Mode**: Book specialized teams (e.g., 5-worker squads) or individual specialized operators.
- **Billing & Discrepancy Reconciliation**: Farmers review post-completion invoices, report any discrepancy (hours/trees/materials), and complete payment via Cash or Razorpay/UPI gateway.

### 8. Service Provider (SP) Portal (`/sp/*`)
- **Self-Serve Dashboard**: Manage incoming bookings, approve/reject job requests, and block calendar availability.
- **Worker Capacity Configuration**: Configure workforce allocation into teams and individual workers.
- **Invoice Generation & Cash Confirmation**: Adjust final billable metrics post-job, generate digital invoices, and record cash payments.

### 9. Interactive Product Tour & Sample Data Mode
- **Feature Demos**: Step-by-step interactive tours highlighting key features across all modules.
- **Demo Mode**: Test drive the platform with pre-populated sample agricultural datasets without modifying production records.

---

## 🎨 UI/UX & Design Architecture

- **Tailwind CSS & Glassmorphism**: Tailored design tokens, subtle borders, frosted glass overlays, and modern card styling.
- **Dark Mode Support**: Deep slate and neutral dark themes with high-contrast text and non-glare input elements.
- **Responsive Mobile Layout**:
  - Touch-friendly sliding navigation drawer on mobile viewports with an intuitive close button.
  - Dedicated bottom navigation bar on handheld screens for fast navigation.
  - Horizontally scrollable and responsive charts that adapt without cramping.

---

## 🛠 Technology Stack

- **Framework**: [React 18](https://react.dev/)
- **Build Tool**: [Vite 5](https://vitejs.dev/)
- **Styling**: [TailwindCSS 3](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Chart.js](https://www.chartjs.org/) / `react-chartjs-2`
- **Routing & State**: React Context API (`AuthContext`, `DataContext`, `DemoContext`)

---

## 📂 Project Structure

```
farm360_frontend/
├── public/                 # Static assets, logos, and favicons
├── src/
│   ├── assets/             # Bundled image assets
│   ├── components/
│   │   ├── auth/           # Login, Register, Forgot Password, Farm Selector, Profile
│   │   ├── billing/        # Payment gateway modals & cash confirmation UI
│   │   ├── demo/           # Guided tour modals, sample data banner, tour overlays
│   │   ├── farm/           # CropsPage, DashboardPage, WorkersPage, CropCarePage, InventoryPage, FinancePage
│   │   ├── marketplace/    # BrowseServices, ProviderDetail, BookingModal, MyBookings, Invoices
│   │   ├── settings/       # AccountSettings & security preferences
│   │   └── sp/             # Service Provider dashboard, profile, calendar, and billing
│   ├── contexts/           # AuthContext, DataContext, DemoContext
│   ├── utils/              # API clients, date formatters, currency helpers
│   ├── App.jsx             # Main routing shell & responsive navigation wrapper
│   ├── AuthApp.jsx         # Authentication routing shell
│   ├── index.css           # Global design system tokens, Tailwind directives, dark theme styles
│   └── main.jsx            # Application entrypoint
├── index.html              # HTML5 root with mobile viewport meta tags
├── package.json            # Scripts & dependency definitions
├── tailwind.config.js      # Custom theme colours & breakpoints
└── vite.config.js          # Vite build configuration & dev server proxy
```

---

## ⚙️ Environment Configuration

Create a `.env` file in `farm360_frontend/`:

```env
# URL of the backend microservices (or Caddy Reverse Proxy)
VITE_API_URL=http://localhost

# Optional: Direct service endpoints if running without Caddy
VITE_AUTH_SERVICE_URL=http://localhost:4000
VITE_FARM_SERVICE_URL=http://localhost:4001
VITE_WORKER_SERVICE_URL=http://localhost:4002
VITE_SP_SERVICE_URL=http://localhost:4003

# Payment Gateway Configuration (Optional / Sandbox)
VITE_RAZORPAY_KEY_ID=rzp_test_placeholder
```

---

## 🚀 Running Locally

```bash
# Navigate to the frontend directory
cd farm360_frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The application will be accessible at:
- **Local Dev Server**: `http://localhost:5173`
- **Via Caddy Proxy**: `http://localhost`

### Building for Production
```bash
# Build optimized static bundle to dist/
npm run build

# Preview production build locally
npm run preview
```
