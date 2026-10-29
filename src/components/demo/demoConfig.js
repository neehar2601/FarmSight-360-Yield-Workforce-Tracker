/**
 * demoConfig.js
 *
 * Granular, farmer-focused guide and interactive tour configuration for every page in FarmSight 360:
 * 1. 📌 What the page does
 * 2. 🧭 How to navigate through the page (with direct demo step links)
 * 3. ✍️ How to make entries step-by-step (with direct demo step links)
 * 4. 🧩 How to use that page's components (with direct spotlight links)
 */

export const PAGE_GUIDES = {
    dashboard: {
        id: 'dashboard',
        path: '/',
        name: 'Farm Dashboard',
        icon: '📊',
        whatItDoes: 'Gives you a single-screen executive overview of your entire farm — including today\'s spray weather advisory, financial earnings, harvest totals, and active workers.',
        howToNavigate: [
            {
                text: 'Use the Farm Selector dropdown in the top-right header to switch between different farms (or view all farms combined).',
                tourStepIndex: 1
            },
            {
                text: 'Click any Quick Link card at the bottom of the page to jump directly to Crops, Inventory, Fertilisers, Finance, or Workers.',
                tourStepIndex: 3
            }
        ],
        howToMakeEntries: [
            {
                text: 'The dashboard automatically calculates its numbers from your other pages (Crops, Inventory, Workers, and Sales).',
                tourStepIndex: 1
            },
            {
                text: 'To add new data, click any of the Quick Shortcuts at the bottom (e.g. click "🌾 Crops" to add a new harvest, or "👷 Workers" to mark today\'s roll call).',
                tourStepIndex: 3
            }
        ],
        componentsGuide: [
            {
                name: '🌦️ Agri-Weather & Spray Advisory',
                desc: 'Shows current temperature, humidity, and rainfall probability. It tells you whether today is a safe window for spraying fertilisers or pesticides without rain wash-off.',
                tourStepIndex: 0
            },
            {
                name: '📈 Executive KPI Stat Cards',
                desc: 'Five primary cards: Total Income (green), Total Expenses (red), Net Profit (with margin %), Total Harvest in kg, and Active Workers today.',
                tourStepIndex: 1
            },
            {
                name: '📊 6-Month Income & Expense Chart',
                desc: 'Green curve represents monthly crop sales; red curve represents farm expenses. Hover over any month to see exact figures.',
                tourStepIndex: 2
            },
            {
                name: '🌾 6-Month Harvest Bar Chart',
                desc: 'Displays the total weight (kg/tons) harvested across all crops each month.',
                tourStepIndex: 2
            },
            {
                name: '⚡ Quick Entry Shortcuts',
                desc: 'Direct shortcuts to jump straight to making entries in Crops, Inventory, Fertilisers, Finance, or Workers.',
                tourStepIndex: 3
            }
        ],
        tourSteps: [
            {
                target: '#demo-weather-widget',
                category: '📌 What This Page Does',
                title: '1. Weather & Agri-Advisory',
                content: 'Check here every morning before starting field work. It gives you the live temperature, rain probability, and warns you if weather is unsafe for spraying chemicals.',
                tip: 'Look for "Ideal Spray Window" before sending workers out to spray.'
            },
            {
                target: '#demo-kpi-grid',
                category: '🧭 Navigation & Farm Health',
                title: '2. Executive Farm Health KPIs',
                content: 'These 5 cards show your total earnings, operating costs, net profit, total harvest weight, and how many workers showed up today.',
                tip: 'All numbers update automatically whenever you make entries in other tabs.'
            },
            {
                target: '#demo-charts-section',
                category: '🧭 Financial & Harvest Trends',
                title: '3. 6-Month Income & Yield Curves',
                content: 'Compare your income against your expenses over the last 6 months to see if your farm is operating profitably, and track monthly harvest tonnage.',
                tip: 'Click "View Finance →" or "View Crops →" to open the detailed ledger.'
            },
            {
                target: '#demo-quick-actions',
                category: '✍️ How to Make Entries',
                title: '4. Quick Shortcuts to Make Entries',
                content: 'Use these shortcuts to jump straight to making entries: add a new crop, record inventory use, mark worker attendance, or check finances.',
                tip: 'Everything you enter in those sections syncs right back to this dashboard.'
            }
        ]
    },

    crops: {
        id: 'crops',
        path: '/farm/crops',
        name: 'My Crops',
        icon: '🌾',
        whatItDoes: 'Tracks every crop cultivated on your farm — from planting and field allocation to harvesting, batch grading, and recording sales revenue.',
        howToNavigate: [
            {
                text: 'Use the top tabs ("My Crops" vs "Archived") to switch between currently active crops and past completed seasons.',
                tourStepIndex: 2
            },
            {
                text: 'Each card represents a crop batch on your farm (e.g. Tomatoes, Potatoes, Wheat) with its variety and days to harvest.',
                tourStepIndex: 0
            }
        ],
        howToMakeEntries: [
            {
                text: 'Step 1: Click the green "+ Add Crop" button at the top right.',
                tourStepIndex: 1
            },
            {
                text: 'Step 2: Enter Crop Name (e.g. Tomatoes), Variety (e.g. Roma / Hybrid), Planting Date, and Area in acres.',
                tourStepIndex: 1
            },
            {
                text: 'Step 3: When crops are ready, click "Record Harvest" on the crop card -> enter date, weight (kg), and quality grade.',
                tourStepIndex: 4
            },
            {
                text: 'Step 4: When selling produce, click "Sell Crop" -> enter quantity sold and price/kg. Money credits directly to Farm Finance!',
                tourStepIndex: 5
            }
        ],
        componentsGuide: [
            {
                name: '+ Add Crop Button',
                desc: 'Opens the form to register a new crop cycle on your farm.',
                tourStepIndex: 1
            },
            {
                name: 'My Crops vs Archived Tabs',
                desc: 'Quickly toggle between active growing crops in the field and archived past seasons.',
                tourStepIndex: 2
            },
            {
                name: '🌾 Harvested Produce Panel',
                desc: 'Displays total kilograms harvested, total sold to buyers, and stock currently available in storage.',
                tourStepIndex: 3
            },
            {
                name: '🌾 Record Harvest Button',
                desc: 'Click this when harvesting in the field to record date, gross weight (kg), and quality grade.',
                tourStepIndex: 4
            },
            {
                name: '💰 Sell Crop Button',
                desc: 'Records crop sales revenue (quantity sold × price/kg). Automatically credits money to your Farm Finance page!',
                tourStepIndex: 5
            },
            {
                name: '🗂️ Sort Grade (Segregate) Button',
                desc: 'Allows you to divide raw bulk harvest into quality grades (e.g. 200kg Grade A, 100kg Standard).',
                tourStepIndex: 6
            },
            {
                name: '📜 Crop Lifecycle History Button',
                desc: 'Opens a complete timeline of all plantings, harvests, spray treatments, and sales for that crop.',
                tourStepIndex: 7
            }
        ],
        tourSteps: [
            {
                target: '#demo-crops-header',
                category: '📌 What This Page Does',
                title: '1. Crop Cultivation Hub',
                content: 'This page tracks every crop on your farm — monitoring acreage, planting dates, days until harvest, produce stock, and sales revenue.',
                tip: 'Seasonal crops and perennial plantations can both be managed here.'
            },
            {
                target: '#demo-add-crop-btn',
                category: '✍️ How to Make Entries (Step 1)',
                title: '2. Adding a New Crop Cycle',
                content: 'Click "+ Add Crop" to register a new crop. Enter the crop name, hybrid variety, planting date, and plot size in acres.',
                tip: 'You can also specify initial seeds or saplings purchased to record the expense.'
            },
            {
                target: '#demo-crop-tabs',
                category: '🧭 How to Navigate',
                title: '3. Active Crops vs Past Seasons',
                content: 'Switch between "My Crops" for crops currently growing in the ground, and "Archived" to review previous completed harvest seasons.',
                tip: 'Archiving finished crops keeps your active screen clean and focused.'
            },
            {
                target: '#demo-crop-produce-panel',
                category: '🧩 Page Component',
                title: '4. Produce Inventory & Sales Stock',
                content: 'Shows total harvest weight in kg, total sold to buyers, and currently available inventory ready for sale or sorting.',
                tip: 'Available stock updates automatically whenever you harvest or sell.'
            },
            {
                target: '#demo-crop-harvest-btn',
                category: '✍️ How to Make Entries (Step 2)',
                title: '5. Recording a Field Harvest',
                content: 'When crops are harvested, click "Record Harvest". Enter the harvest date, gross weight (kg), and quality grade (Grade A, Standard, etc.).',
                tip: 'Harvested amounts automatically increase your available stock in storage.'
            },
            {
                target: '#demo-crop-sell-btn',
                category: '✍️ How to Make Entries (Step 3)',
                title: '6. Selling Crop Produce for Revenue',
                content: 'Click "Sell Crop" to record sales to local buyers or mandis. Enter quantity sold and price per kg — income is credited directly to Farm Finance!',
                tip: 'Track sales by grade to see which quality grade earned the highest price.'
            },
            {
                target: '#demo-crop-segregate-btn',
                category: '🧩 Page Component',
                title: '7. Grading & Sorting Produce',
                content: 'Click "Sort Grade" to split unsegregated raw harvest into premium vs standard quality batches with higher selling prices.',
                tip: 'Graded produce fetches higher market rates than unsegregated bulk.'
            },
            {
                target: '#demo-crop-history-btn',
                category: '🧩 Page Component',
                title: '8. Crop History & Treatment Log',
                content: 'Click "History" to review every spray treatment, harvest batch, and sale recorded for this crop from planting to today.',
                tip: 'Provides a complete audit trail for agricultural certification.'
            }
        ]
    },

    workers: {
        id: 'workers',
        path: '/workers',
        name: 'Workers & Attendance Hub',
        icon: '👥',
        whatItDoes: 'Everything you need to manage farm laborers: register workers, take 1-click daily attendance, assign tasks and crop tags, disburse cash advances, and pay salaries.',
        howToNavigate: [
            {
                text: 'Review the summary metrics bar for total active headcount, unpaid carryforward wage liability, and active advances.',
                tourStepIndex: 2
            },
            {
                text: 'Use the top tabs: "Active Workers" (main cards & roll call), "Monthly Calendar", and "Inactive Roster" (for off-season workers).',
                tourStepIndex: 3
            }
        ],
        howToMakeEntries: [
            {
                text: 'Step 1: Click "+ Add Worker" at top right -> Enter Name, Role, Daily Wage in ₹, and phone number.',
                tourStepIndex: 1
            },
            {
                text: 'Step 2: To mark today\'s attendance: On any worker\'s card, simply click P (Present), H (Half-Day), or A (Absent).',
                tourStepIndex: 4
            },
            {
                text: 'Step 3: Tag their task (Harvesting, Spraying, Sowing) and select which crop they worked on to attribute labor cost.',
                tourStepIndex: 5
            },
            {
                text: 'Step 4: To pay wages: Click "💰 Pay Salary" -> System calculates: Days worked × Daily wage - Loan deductions = Net Payout -> Confirm!',
                tourStepIndex: 7
            },
            {
                text: 'Step 5: To give an advance / loan: Click "💵 Advance" -> Enter cash given -> Worker\'s loan balance updates immediately.',
                tourStepIndex: 8
            }
        ],
        componentsGuide: [
            {
                name: '+ Add Worker Button',
                desc: 'Registers a new permanent or seasonal farm hand with their daily salary rate.',
                tourStepIndex: 1
            },
            {
                name: 'Active Workers & Liability Summary Bar',
                desc: 'Top bar showing headcount, total unpaid carryforward wages owed to workers, and active loan balances.',
                tourStepIndex: 2
            },
            {
                name: 'Attendance Navigation Tabs',
                desc: 'Toggle between Active Workers, Monthly Calendar, and Inactive Roster.',
                tourStepIndex: 3
            },
            {
                name: 'P / H / A Quick Attendance Buttons',
                desc: 'Fast 1-click morning roll call. P = Full Day, H = Half Day (0.5 wage), A = Absent (no wage).',
                tourStepIndex: 4
            },
            {
                name: 'Task & Crop Activity Tagger',
                desc: 'Assigns worker activity (Harvesting, Weeding, Spraying) and links cost to a specific crop.',
                tourStepIndex: 5
            },
            {
                name: 'Unpaid Salary & Loan Owed Badges',
                desc: 'Realtime cards showing exact unpaid wage accrued to date and outstanding advances.',
                tourStepIndex: 6
            },
            {
                name: '💰 Pay Salary Button',
                desc: 'Settles accrued unpaid days, deducts agreed loan repayments, and records payroll expense to Finance.',
                tourStepIndex: 7
            },
            {
                name: '💵 Advance & Settle Loan Buttons',
                desc: 'Keeps an accurate running total of cash advances borrowed so you never lose track.',
                tourStepIndex: 8
            }
        ],
        tourSteps: [
            {
                target: '#demo-workers-header',
                category: '📌 What This Page Does',
                title: '1. Workforce Command Hub',
                content: 'Manage all permanent and seasonal farm hands in one place — attendance roll call, task allocation, wage calculations, and loans.',
                tip: 'Never lose track of who worked on which field or who received cash advances.'
            },
            {
                target: '#demo-add-worker-btn',
                category: '✍️ How to Make Entries (Step 1)',
                title: '2. Adding a Farm Hand',
                content: 'Click "+ Add Worker" to register a new laborer with their name, role (Harvester, Driver, Hand), phone number, and agreed daily wage in ₹/day.',
                tip: 'Daily wage rate is used to automatically calculate accrued pay each morning.'
            },
            {
                target: '#demo-workers-summary',
                category: '🧭 Navigation & Payroll',
                title: '3. Unpaid Wages & Loan Liability Bar',
                content: 'The top summary bar shows active headcount, total unpaid carryforward wages owed to workers, and total outstanding loan balances.',
                tip: 'Gives you the exact cash needed before payday.'
            },
            {
                target: '#demo-attendance-tabs',
                category: '🧭 Navigation Tabs',
                title: '4. Active Roster vs Calendar Views',
                content: 'Switch between "Active Workers" for daily cards, "Monthly Calendar" for grid roll calls, and "Inactive Roster" for seasonal workers.',
                tip: 'You can archive seasonal workers after harvest and reactivate them next season.'
            },
            {
                target: '#demo-attendance-buttons',
                category: '✍️ How to Make Entries (Step 2)',
                title: '5. 1-Click Morning Roll Call (P / H / A)',
                content: 'Mark attendance in seconds: click P for Present (full wage), H for Half-day (0.5 wage), or A for Absent. Accrued salary calculates automatically.',
                tip: 'Marking attendance takes less than 30 seconds every morning.'
            },
            {
                target: '#demo-task-activity-selector',
                category: '✍️ How to Make Entries (Step 3)',
                title: '6. Assigning Tasks & Target Crops',
                content: 'Assign the worker\'s activity (Harvesting, Weeding, Spraying, Sowing) and select the specific crop. Labor cost is accurately attributed to that crop!',
                tip: 'Helps Farm Finance show exact labor cost per crop.'
            },
            {
                target: '#demo-worker-financial-badges',
                category: '🧩 Page Component',
                title: '7. Realtime Accrued Wage & Loan Balance',
                content: 'Shows the exact unpaid wage accrued to date and any active loans borrowed by the worker.',
                tip: 'Green badge = unpaid salary; amber badge = loan owed by worker.'
            },
            {
                target: '#demo-pay-salary-btn',
                category: '✍️ How to Make Entries (Step 4)',
                title: '8. Paying Worker Salaries',
                content: 'On payday, click "Pay Salary". The system automatically computes: Worked Days × Daily Wage minus Loan deductions. Confirm payout to update Finance!',
                tip: 'Wage payouts automatically sync to your Farm Finance expense report.'
            },
            {
                target: '#demo-advance-btn',
                category: '✍️ How to Make Entries (Step 5)',
                title: '9. Disbursing Advances & Loans',
                content: 'When giving cash advances before harvest, click "Advance" and enter the amount. Loan balance updates automatically and can be deducted on payday.',
                tip: 'Use "Settle Loan" if the worker pays back cash directly.'
            }
        ]
    },

    inventory: {
        id: 'inventory',
        path: '/farm/inventory',
        name: 'Inventory & Stock',
        icon: '📦',
        whatItDoes: 'Tracks all farm supplies, tools, irrigation hardware, crates, and packaging materials so you always know what is in stock and when to reorder.',
        howToNavigate: [
            {
                text: 'Switch between "📦 Stock Overview" (current items in shed) and "🪣 Usage Tracker & Tagging" (where items were consumed).',
                tourStepIndex: 2
            },
            {
                text: 'Filter items by category using the category pills or create new categories with "+ Category".',
                tourStepIndex: 6
            }
        ],
        howToMakeEntries: [
            {
                text: 'Step 1: Click "+ Add Item" at top right -> Enter Name, Category (Tools, Packaging, Equipment), Unit, and Reorder threshold.',
                tourStepIndex: 1
            },
            {
                text: 'Step 2: When purchasing supplies: Click "🛒 Buy" on any item -> Enter quantity bought and price -> Automatically updates stock and finance expenses.',
                tourStepIndex: 3
            },
            {
                text: 'Step 3: When using supplies: Click "🪣 Use" -> Enter amount consumed and choose which crop it was used on.',
                tourStepIndex: 4
            }
        ],
        componentsGuide: [
            {
                name: '+ Add Item Button',
                desc: 'Opens the registration form to add new tools, packaging crates, or irrigation supplies.',
                tourStepIndex: 1
            },
            {
                name: 'Stock Overview vs Usage Tracker Tabs',
                desc: 'Toggle between physical inventory counts on hand and historical consumption logs.',
                tourStepIndex: 2
            },
            {
                name: '🛒 Buy / Restock Button',
                desc: 'Records newly purchased supplies, increasing quantity on hand and sending the cost to Farm Finance.',
                tourStepIndex: 3
            },
            {
                name: '🪣 Use / Consume Button',
                desc: 'Deducts material quantity and optionally tags it to a crop to track input expenses.',
                tourStepIndex: 4
            },
            {
                name: '🌱 Fertilisers & Sprays Banner',
                desc: 'Direct shortcut to the dedicated Fertilisers & Sprays module for all chemicals and soil nutrients.',
                tourStepIndex: 5
            },
            {
                name: '+ Category Button',
                desc: 'Lets you create custom categories to organize your farm tools and materials.',
                tourStepIndex: 6
            }
        ],
        tourSteps: [
            {
                target: '#demo-inventory-tabs',
                category: '📌 What This Page Does',
                title: '1. Farm Supplies & Tools Inventory',
                content: 'Keep track of tools, crates, drip pipes, and packaging materials so you never run out during critical farming operations.',
                tip: 'Look at the counts next to "Stock Overview" to see your total items.'
            },
            {
                target: '#demo-add-inventory-btn',
                category: '✍️ How to Make Entries (Step 1)',
                title: '2. Adding an Item to Stock',
                content: 'Click "+ Add Item" to register supplies. Enter the item name, category (Tools, Packaging, Equipment), unit, and safety reorder minimum.',
                tip: 'Setting a reorder minimum triggers an alert when supplies run low.'
            },
            {
                target: '#demo-inventory-tabs',
                category: '🧭 How to Navigate',
                title: '3. Stock Overview vs Usage Tracker',
                content: 'Toggle "Stock Overview" to see current quantities on hand, or switch to "Usage Tracker" to verify where items were consumed.',
                tip: 'The Usage Tracker alerts you if any material was used without linking it to a crop.'
            },
            {
                target: '#demo-inventory-buy-btn',
                category: '✍️ How to Make Entries (Step 2)',
                title: '4. Buying / Restocking Supplies',
                content: 'When you buy new supplies from the market, click "Buy" on the item. Enter quantity bought and cost — stock increases and expense is sent to Finance!',
                tip: 'Purchases automatically update your Farm Finance expenses.'
            },
            {
                target: '#demo-inventory-use-btn',
                category: '✍️ How to Make Entries (Step 3)',
                title: '5. Using Materials & Tagging to Crops',
                content: 'Click "Use" whenever materials are taken from the shed. Enter quantity used and link it to a crop to track true input costs.',
                tip: 'Tagging usages to crops ensures accurate crop profit calculation.'
            },
            {
                target: '#demo-inventory-cropcare-banner',
                category: '🧩 Page Component',
                title: '6. Dedicated Fertilisers & Sprays Banner',
                content: 'All soil nutrients, chemical sprays, and fungicides have a dedicated module. Click the banner to jump directly to Fertilisers & Sprays!',
                tip: 'Keeps chemical logs and spray schedules separated from general farm equipment.'
            },
            {
                target: '#demo-inventory-category-btn',
                category: '🧩 Page Component',
                title: '7. Creating Custom Categories',
                content: 'Organize your items cleanly by creating custom categories such as Irrigation, Harvester Spares, or Crates.',
                tip: 'Custom categories make filtering fast when you have dozens of items.'
            }
        ]
    },

    crop_care: {
        id: 'crop_care',
        path: '/farm/crop-care',
        name: 'Fertilisers & Sprays',
        icon: '🧪',
        whatItDoes: 'Dedicated tracker for soil nutrients (Urea, DAP, Potash, Compost), bio-pesticides, weedicides, and chemical spray logs — keeping crops healthy and food-safe.',
        howToNavigate: [
            {
                text: 'Use the left sidebar to filter by category: Fertilisers, Pesticides, Herbicides, Fungicides, or Plant Tonics.',
                tourStepIndex: 2
            },
            {
                text: 'Inspect the top stat cards for Active Inputs, Low Stock alerts, and Total Attributed Material Value.',
                tourStepIndex: 0
            }
        ],
        howToMakeEntries: [
            {
                text: 'Step 1: Click the green "+ Add Input" button at top right -> Enter chemical name, category, initial stock, and unit.',
                tourStepIndex: 1
            },
            {
                text: 'Step 2: When applying sprays in the field: Click "🪣 Use" on any card -> Select target crop, dosage amount, and date.',
                tourStepIndex: 3
            },
            {
                text: 'Step 3: When purchasing more inputs: Click "🛒 Buy" on any input card -> Enter quantity bought and price.',
                tourStepIndex: 4
            }
        ],
        componentsGuide: [
            {
                name: '🧪 Top Metric Stats Cards',
                desc: 'Shows how many nutrients are in storage, low-stock reorder warnings, and total monetary value applied.',
                tourStepIndex: 0
            },
            {
                name: '+ Add Input Button',
                desc: 'Registers a new chemical, bio-fertiliser, or organic input with its initial stock and measurement unit.',
                tourStepIndex: 1
            },
            {
                name: '🌱 Input Classification Sidebar',
                desc: 'Quickly find specific items by clicking Fertilisers, Pesticides, Fungicides, or Plant Tonics.',
                tourStepIndex: 2
            },
            {
                name: '🪣 Use / Log Spray Application Button',
                desc: 'Records chemical applications with date, dosage, and target crop to maintain food-safety compliance.',
                tourStepIndex: 3
            },
            {
                name: '🛒 Buy / Restock Button',
                desc: 'Increases chemical stock levels and automatically records purchase bills in Farm Finance.',
                tourStepIndex: 4
            }
        ],
        tourSteps: [
            {
                target: '#demo-cropcare-stats',
                category: '📌 What This Page Does',
                title: '1. Fertilisers, Pesticides & Sprays',
                content: 'Manage all soil nutrients and chemical protection products in one dedicated place. Log applications to ensure food-safety compliance.',
                tip: 'Keeping spray logs ensures compliance with agricultural quality standards.'
            },
            {
                target: '#demo-cropcare-add-btn',
                category: '✍️ How to Make Entries (Step 1)',
                title: '2. Adding an Input Chemical / Nutrient',
                content: 'Click "+ Add Input" to register a new chemical or organic nutrient. Enter product name, active ingredient, initial stock, and unit (kg, litres, bags).',
                tip: 'You can also add safety notes and expiry dates.'
            },
            {
                target: '#demo-cropcare-sidebar',
                category: '🧭 How to Navigate',
                title: '3. Filtering by Chemical Classification',
                content: 'Use the left sidebar to quickly filter between Fertilisers, Bio-pesticides, Herbicides, Fungicides, or Growth Tonics.',
                tip: 'Click any category to filter the list instantly.'
            },
            {
                target: '#demo-cropcare-use-btn',
                category: '✍️ How to Make Entries (Step 2)',
                title: '4. Logging Spray / Fertiliser Applications',
                content: 'Click "Use" when applying sprays in the field. Enter dosage and select the target crop. Stock is deducted and application cost is linked to the crop!',
                tip: 'Stock is automatically reduced and linked to your crop expense.'
            },
            {
                target: '#demo-cropcare-buy-btn',
                category: '✍️ How to Make Entries (Step 3)',
                title: '5. Restocking Chemical Inventory',
                content: 'Click "Buy" when purchasing new bags or bottles. Enter quantity and total bill amount to update inventory and farm expenses.',
                tip: 'Restock entries automatically flow into your Farm Finance expense report.'
            }
        ]
    },

    finance: {
        id: 'finance',
        path: '/farm/finance',
        name: 'Farm Finance & Profit/Loss',
        icon: '💰',
        whatItDoes: 'Complete profit & loss bookkeeping — automatically aggregates crop sales revenue, worker wages, and supply purchases with zero manual spreadsheet math.',
        howToNavigate: [
            {
                text: 'Use the "Select Crop View" toolbar at the top to toggle between overall farm finances and individual crop P&L.',
                tourStepIndex: 1
            },
            {
                text: 'Scroll down to inspect Crop Profitability tables, Activity Cost breakdowns, and the Unified Transactions Ledger.',
                tourStepIndex: 7
            }
        ],
        howToMakeEntries: [
            {
                text: 'Step 1: Produce sales flow in automatically when you click "Sell" on any crop in the Crops page.',
                tourStepIndex: 2
            },
            {
                text: 'Step 2: Labor expenses flow in automatically when you confirm salary payouts in the Workers page.',
                tourStepIndex: 3
            },
            {
                text: 'Step 3: Supply purchases flow in automatically when you restock items in Inventory or Fertilisers.',
                tourStepIndex: 3
            },
            {
                text: 'Step 4: Contractor bills flow in automatically when you confirm completed service bookings.',
                tourStepIndex: 7
            }
        ],
        componentsGuide: [
            {
                name: 'Select Crop View Toolbar',
                desc: 'Filter between all crops combined or isolate finances for a single crop.',
                tourStepIndex: 1
            },
            {
                name: '📈 Total Income Card',
                desc: 'Green card showing all cash brought in from crop sales and farm activities.',
                tourStepIndex: 2
            },
            {
                name: '📉 Total Expenses Card',
                desc: 'Red card showing total money spent on labor salaries, fertilisers, fuel, and supplies.',
                tourStepIndex: 3
            },
            {
                name: '📊 Net Profit / Loss Card',
                desc: 'Shows whether your farm is operating at a profit or loss, along with your profit margin percentage.',
                tourStepIndex: 4
            },
            {
                name: '🌾 Crop Financial Performance & Profitability Table',
                desc: 'Full crop-by-crop profit breakdown comparing revenue vs direct expenses per crop.',
                tourStepIndex: 5
            },
            {
                name: '⚡ Cost Breakdown by Activity',
                desc: 'Breaks down farm spending by operation: Harvesting, Sowing, Spraying, Weeding, and Land Prep.',
                tourStepIndex: 6
            },
            {
                name: 'Unified Financial Transactions Ledger',
                desc: 'Complete audit trail of every income, expense, and service transaction.',
                tourStepIndex: 7
            }
        ],
        tourSteps: [
            {
                target: '#demo-finance-kpis',
                category: '📌 What This Page Does',
                title: '1. Automated Farm Profit & Loss',
                content: 'See exactly how much money your farm made and spent this season. The Net Profit card calculates your exact profit margin.',
                tip: 'Green net profit means your farm is earning more than it spends.'
            },
            {
                target: '#demo-finance-crop-filter',
                category: '🧭 How to Navigate',
                title: '2. Filter Finances by Single Crop',
                content: 'Click any crop pill (e.g. Tomatoes, Wheat) to isolate revenue, direct labor expenses, and material costs for that single crop.',
                tip: 'Helps you decide which crops to plant more of next season.'
            },
            {
                target: '#demo-finance-income-card',
                category: '🧩 Page Component',
                title: '3. Total Revenue from Crop Sales',
                content: 'Income is generated from crop sales recorded in the Crops page. Filter by crop to see which variety generated the most revenue.',
                tip: 'Includes grade-wise breakdown if produce was graded.'
            },
            {
                target: '#demo-finance-expense-card',
                category: '🧩 Page Component',
                title: '4. Operating Expenses (Labor & Supplies)',
                content: 'Total expenses combine laborer wages paid, fertiliser & pesticide purchases, fuel, and equipment maintenance.',
                tip: 'Expenses are automatically attributed to crops when workers or materials are tagged.'
            },
            {
                target: '#demo-finance-profit-card',
                category: '🧩 Page Component',
                title: '5. Net Profit Margin & Farm Health',
                content: 'Calculates: Total Income minus Total Expenses. Shows positive net margin in blue and loss in orange.',
                tip: 'Aim for a healthy net margin across multiple seasons.'
            },
            {
                target: '#demo-finance-crop-table',
                category: '🧩 Page Component',
                title: '6. Side-by-Side Crop Profitability',
                content: 'Compare all your crops side-by-side to see which crops generate the highest profit margins per acre.',
                tip: 'Highlights high-return crops vs loss-making plantings.'
            },
            {
                target: '#demo-finance-activity-cost',
                category: '🧩 Page Component',
                title: '7. Cost Breakdown by Activity',
                content: 'Breaks down farm spending by operation: Harvesting, Sowing, Spraying, Weeding, and Land Prep.',
                tip: 'See if harvesting or weeding is consuming the bulk of your labor budget.'
            },
            {
                target: '#demo-finance-ledger',
                category: '✍️ How Entries Flow In',
                title: '8. Unified Financial Ledger',
                content: 'Every entry you make across Crops, Inventory, and Workers automatically posts here. Filter by Income, Expense, or Services.',
                tip: 'Provides an audit-ready financial record for bank loans and subsidies.'
            }
        ]
    },

    services: {
        id: 'services',
        path: '/services',
        name: 'Service Provider Marketplace',
        icon: '🚜',
        whatItDoes: 'Connects you with verified farm contractors — hire tractor operators for plowing, drone sprayers, combine harvesters, or borewell drillers on demand.',
        howToNavigate: [
            {
                text: 'Use the search bar at the top to type a service name (e.g. Tractor, Drone) or location.',
                tourStepIndex: 0
            },
            {
                text: 'Use the date picker to check which contractors are free on your required dates.',
                tourStepIndex: 1
            }
        ],
        howToMakeEntries: [
            {
                text: 'Step 1: Browse the contractor cards and click "View & Book" on any provider.',
                tourStepIndex: 2
            },
            {
                text: 'Step 2: Review their equipment, rates per acre/hour, and reviews.',
                tourStepIndex: 2
            },
            {
                text: 'Step 3: Select your dates, acreage, and machine team size -> Confirm booking (holds slot for 10 minutes).',
                tourStepIndex: 2
            }
        ],
        componentsGuide: [
            {
                name: 'Search & Location Bar',
                desc: 'Find available operators near your region for your specific working dates.',
                tourStepIndex: 0
            },
            {
                name: 'Date Availability Picker',
                desc: 'Check live contractor availability for the exact dates you need field work.',
                tourStepIndex: 1
            },
            {
                name: '🚜 View & Book Service Button',
                desc: 'Opens the booking wizard to pick deployment size and lock in the contractor\'s schedule.',
                tourStepIndex: 2
            }
        ],
        tourSteps: [
            {
                target: '#demo-sp-filters',
                category: '📌 What This Page Does',
                title: '1. Hire Farm Contractors',
                content: 'When you need heavy machinery or specialized labor (tractor tilling, drone spraying, harvesting), find vetted local providers here.',
                tip: 'Search by equipment type or contractor location.'
            },
            {
                target: '#demo-sp-filters',
                category: '🧭 How to Navigate',
                title: '2. Date Availability & Region Filters',
                content: 'Pick your scheduled field work dates to immediately see which contractors have free machinery slots.',
                tip: 'Booking in advance ensures machine availability during peak season.'
            },
            {
                target: '#demo-sp-book-btn',
                category: '✍️ How to Make Entries',
                title: '3. Booking a Machine or Crew',
                content: 'Click "View & Book" on any contractor card to review equipment specs, hourly/acre rates, and confirm your booking.',
                tip: 'Booking holds the slot with a live 10-minute hold reservation.'
            }
        ]
    },

    bookings: {
        id: 'bookings',
        path: '/bookings',
        name: 'My Booked Services',
        icon: '📋',
        whatItDoes: 'Tracks all your booked farm contractors — check booking status, review itemized bills from contractors, and make verified payments.',
        howToNavigate: [
            {
                text: 'All your active and past contractor bookings are listed here chronologically.',
                tourStepIndex: 0
            }
        ],
        howToMakeEntries: [
            {
                text: 'Step 1: When a contractor finishes work, their bill will appear here labeled "Bill to Verify".',
                tourStepIndex: 1
            },
            {
                text: 'Step 2: Click "View Bill / Pay" -> check the acreage and labor hours -> click Confirm Payment to release money.',
                tourStepIndex: 1
            },
            {
                text: 'Step 3: The payment automatically records into your Farm Finance expenses!',
                tourStepIndex: 1
            }
        ],
        componentsGuide: [
            {
                name: 'Contractor Booking Card',
                desc: 'Shows booking status (Hold, Confirmed, In Progress, Completed), dates, and contractor details.',
                tourStepIndex: 0
            },
            {
                name: '🧾 Verify Bill & Pay Button',
                desc: 'Lets you review the contractor\'s invoice line-by-line before releasing money.',
                tourStepIndex: 1
            }
        ],
        tourSteps: [
            {
                target: '#demo-bookings-list',
                category: '📌 What This Page Does',
                title: '1. Service Tracking & Status',
                content: 'Check the status of all your booked machinery and contract labor jobs in one place.',
                tip: 'Track active hold timers and scheduled deployment dates.'
            },
            {
                target: '#demo-bookings-list',
                category: '✍️ How to Make Entries',
                title: '2. Reviewing Bills & Paying Contractors',
                content: 'When the contractor completes the job, click "View Bill" to verify the work done and confirm payment.',
                tip: 'Paid bills automatically record to your farm expense ledger.'
            }
        ]
    },

    sp_portal: {
        id: 'sp_portal',
        path: '/sp/dashboard',
        name: 'Service Provider Portal',
        icon: '🧑‍🔧',
        whatItDoes: 'Dedicated portal for agricultural contractors to manage machine fleets, view incoming farmer requests, block unavailable calendar dates, and issue bills.',
        howToNavigate: [
            {
                text: 'Use the top menu to switch between "📊 Dashboard & Jobs" and "🛠️ Services & Profile".',
                tourStepIndex: 0
            }
        ],
        howToMakeEntries: [
            {
                text: 'To set service rates: Go to Services & Profile -> Add service package with custom rate (e.g. ₹800 / acre).',
                tourStepIndex: 0
            },
            {
                text: 'To block out dates: Open Block Calendar -> Click dates when equipment is busy or under maintenance.',
                tourStepIndex: 0
            },
            {
                text: 'To bill a farmer: On any completed job, click "Generate Bill" -> Enter acreage or hours -> Send to farmer!',
                tourStepIndex: 0
            }
        ],
        componentsGuide: [
            {
                name: 'Dashboard Jobs List',
                desc: 'Incoming booking requests from farmers with requested dates and acreage.',
                tourStepIndex: 0
            },
            {
                name: '📅 Block-Dates Calendar',
                desc: 'Mark holiday or maintenance dates as unavailable so farmers don\'t book on those days.',
                tourStepIndex: 0
            },
            {
                name: '📄 Bill Generator',
                desc: 'Creates itemized bills for fuel, machine time, and crew deployment.',
                tourStepIndex: 0
            }
        ],
        tourSteps: [
            {
                target: '#demo-sp-nav',
                category: '📌 What This Page Does',
                title: '1. Contractor Operations',
                content: 'If you provide machinery or farm labor services, this portal lets you manage your business completely separate from farmer data.',
                tip: 'Switch between your job queue and service profile in the top bar.'
            }
        ]
    }
};

export const getGuideForPath = (pathname) => {
    if (!pathname || pathname === '/') return PAGE_GUIDES.dashboard;
    if (pathname.startsWith('/farm/crops')) return PAGE_GUIDES.crops;
    if (pathname.startsWith('/farm/inventory')) return PAGE_GUIDES.inventory;
    if (pathname.startsWith('/farm/crop-care')) return PAGE_GUIDES.crop_care;
    if (pathname.startsWith('/farm/finance')) return PAGE_GUIDES.finance;
    if (pathname.startsWith('/workers')) return PAGE_GUIDES.workers;
    if (pathname.startsWith('/services')) return PAGE_GUIDES.services;
    if (pathname.startsWith('/bookings')) return PAGE_GUIDES.bookings;
    if (pathname.startsWith('/sp/')) return PAGE_GUIDES.sp_portal;
    return PAGE_GUIDES.dashboard;
};
