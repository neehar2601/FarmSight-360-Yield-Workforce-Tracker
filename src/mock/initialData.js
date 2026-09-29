/**
 * initialData.js
 *
 * Seed data representing the farm360 PostgreSQL database.
 * Matches existing schemas:
 *   - users (farmers, customers, b2b_buyers, superadmin)
 *   - farms
 *   - crops, crop_harvests, crop_segregations, crop_sales
 *   - inventory_categories, inventory_items, inventory_transactions
 *   - workers, worker_attendance, worker_transactions
 *   - marketplace_listings, hub_consignments, marketplace_orders, b2b_rfqs
 */

export const INITIAL_DATA = {
    // ── USERS ─────────────────────────────────────────────────────────────────
    users: [
        {
            id: 'user-farmer-1',
            name: 'Ramesh Patel',
            email: 'farmer@farm360.com',
            mobile_number: '+91 98450 12345',
            role: 'user', // regular farmer
            avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            is_first_login: false,
            created_at: '2025-01-15T08:00:00Z',
        },
        {
            id: 'user-farmer-2',
            name: 'Anand Kulkarni',
            email: 'anand@krishnavalley.com',
            mobile_number: '+91 98450 67890',
            role: 'user',
            avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
            is_first_login: false,
            created_at: '2025-02-10T08:00:00Z',
        },
        {
            id: 'user-customer-1',
            name: 'Priya Sharma',
            email: 'priya.sharma@example.com',
            mobile_number: '+91 98765 43210',
            role: 'customer', // direct retail consumer
            avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
            is_first_login: false,
            address: {
                street: 'Flat 402, Green Glen Layout, Outer Ring Road, Bellandur',
                city: 'Bengaluru',
                state: 'Karnataka',
                pincode: '560103',
            },
            created_at: '2025-06-01T10:00:00Z',
        },
        {
            id: 'user-b2b-1',
            name: 'Rajesh Gupta (FreshMart)',
            email: 'procurement@freshmart.in',
            mobile_number: '+91 91234 56789',
            role: 'b2b_buyer', // wholesale retailer / business buyer
            avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
            is_first_login: false,
            b2b_profile: {
                company_name: 'FreshMart Supermarkets Pvt Ltd',
                business_type: 'Supermarket Chain (12 Outlets)',
                gstin: '29ABCDE1234F1Z5',
                trade_license: 'TL-BLR-2024-8891',
                contact_person: 'Rajesh Gupta (VP Sourcing)',
                warehouse_address: 'Central Warehouse Plot 14, APMC Yard, Yeshwanthpur, Bengaluru 560022',
            },
            created_at: '2025-04-12T09:30:00Z',
        },
        {
            id: 'user-admin-1',
            name: 'Dr. Kiran Rao',
            email: 'kiran.rao@farm360.com',
            mobile_number: '+91 94480 55443',
            role: 'superadmin', // depot QA manager
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            hub_name: 'farm360 Central Depot #1 (Bengaluru Hub)',
            is_first_login: false,
            created_at: '2025-01-01T00:00:00Z',
        },
    ],

    // ── FARMS ─────────────────────────────────────────────────────────────────
    farms: [
        {
            id: 'farm-1',
            owner_id: 'user-farmer-1',
            name: 'Deccan Organic Farms',
            location: 'Mandya Highway, Maddur Taluk, Karnataka',
            total_area: 14.5,
            area_unit: 'acres',
            is_active: true,
            created_at: '2025-01-15T08:05:00Z',
            pickup_address: 'Gate 2, Deccan Organic Estate, Maddur-Mandya Road (Opp. APMC Weighbridge), Mandya 571428',
            pickup_contact: '+91 98450 12345',
            pickup_hours: '8:00 AM – 6:30 PM (Mon–Sat)',
            farmer_story: 'Practicing 100% natural and regenerative farming for over 8 years. Specializing in organic heirloom tomatoes, Cavendish bananas, and pesticide-free paddy.',
            coordinates: { lat: 12.5844, lng: 77.0422 },
        },
        {
            id: 'farm-2',
            owner_id: 'user-farmer-2',
            name: 'Krishna Valley Orchards',
            location: 'Almatti Basin, Vijayapura, Karnataka',
            total_area: 22.0,
            area_unit: 'acres',
            is_active: true,
            created_at: '2025-02-10T08:10:00Z',
            pickup_address: 'Krishna Valley Agro Farm, Almatti Dam Left Bank, Vijayapura 586201',
            pickup_contact: '+91 98450 67890',
            pickup_hours: '9:00 AM – 5:00 PM (Daily)',
            farmer_story: 'Drip-irrigated fruit orchard producing GI-tagged raisins, table grapes, and sweet Cavendish bananas.',
            coordinates: { lat: 16.3283, lng: 75.8856 },
        },
    ],

    // ── CROPS ─────────────────────────────────────────────────────────────────
    crops: [
        {
            id: 'crop-1',
            farm_id: 'farm-1',
            name: 'Hybrid Roma Tomatoes',
            variety: 'Namdhari NS-592',
            area_planted: 3.5,
            area_unit: 'acres',
            planting_date: '2025-05-10',
            expected_harvest_date: '2025-08-15',
            is_archived: false,
            notes: 'Raised-bed drip irrigation with plastic mulch. Zero synthetic pesticide used.',
            created_at: '2025-05-10T09:00:00Z',
        },
        {
            id: 'crop-2',
            farm_id: 'farm-1',
            name: 'Sona Masoori Paddy',
            variety: 'BPT 5204 (Samba Mahsuri)',
            area_planted: 6.0,
            area_unit: 'acres',
            planting_date: '2025-06-01',
            expected_harvest_date: '2025-10-20',
            is_archived: false,
            notes: 'Aromatic fine-grain paddy. Natural canal irrigation.',
            created_at: '2025-06-01T09:00:00Z',
        },
        {
            id: 'crop-3',
            farm_id: 'farm-2',
            name: 'Cavendish Bananas',
            variety: 'Grand Naine (G9)',
            area_planted: 5.0,
            area_unit: 'acres',
            planting_date: '2024-09-15',
            expected_harvest_date: '2025-07-20',
            is_archived: false,
            notes: 'Tissue-cultured disease-free plants, bunch-sleeved for uniform grading.',
            created_at: '2024-09-15T09:00:00Z',
        },
    ],

    // ── CROP HARVESTS ─────────────────────────────────────────────────────────
    crop_harvests: [
        {
            id: 'harvest-1',
            crop_id: 'crop-1',
            farm_id: 'farm-1',
            quantity: 2800,
            unit: 'kg',
            harvest_date: '2025-08-18',
            notes: 'Batch #1 — early morning pick at peak firmness.',
            created_at: '2025-08-18T11:00:00Z',
        },
        {
            id: 'harvest-2',
            crop_id: 'crop-1',
            farm_id: 'farm-1',
            quantity: 1600,
            unit: 'kg',
            harvest_date: '2025-08-25',
            notes: 'Batch #2 — table-grade ripe.',
            created_at: '2025-08-25T11:00:00Z',
        },
        {
            id: 'harvest-3',
            crop_id: 'crop-3',
            farm_id: 'farm-2',
            quantity: 3200,
            unit: 'kg',
            harvest_date: '2025-08-20',
            notes: 'Uniform bunches, harvested at 80% maturity.',
            created_at: '2025-08-20T10:00:00Z',
        },
    ],

    // ── CROP SEGREGATIONS ─────────────────────────────────────────────────────
    crop_segregations: [
        {
            id: 'seg-1',
            crop_id: 'crop-1',
            farm_id: 'farm-1',
            source_grade: 'Unsegregated',
            target_grade: 'Grade A (Table Grade)',
            quantity: 2400,
            unit: 'kg',
            date: '2025-08-19',
            created_at: '2025-08-19T14:00:00Z',
        },
        {
            id: 'seg-2',
            crop_id: 'crop-1',
            farm_id: 'farm-1',
            source_grade: 'Unsegregated',
            target_grade: 'Grade B (Processing / Puree)',
            quantity: 1600,
            unit: 'kg',
            date: '2025-08-19',
            created_at: '2025-08-19T14:05:00Z',
        },
        {
            id: 'seg-3',
            crop_id: 'crop-3',
            farm_id: 'farm-2',
            source_grade: 'Unsegregated',
            target_grade: 'Grade A Premium',
            quantity: 2800,
            unit: 'kg',
            date: '2025-08-21',
            created_at: '2025-08-21T12:00:00Z',
        },
    ],

    // ── CROP SALES ────────────────────────────────────────────────────────────
    crop_sales: [],

    // ── INVENTORY CATEGORIES & ITEMS ──────────────────────────────────────────
    inventory_categories: [
        { id: 'cat-1', farm_id: 'farm-1', name: 'Packaging & Crates', is_default: true },
        { id: 'cat-2', farm_id: 'farm-1', name: 'Tools & Equipment', is_default: true },
        { id: 'cat-3', farm_id: 'farm-1', name: 'Organic Fertiliser', is_default: true },
        { id: 'cat-4', farm_id: 'farm-1', name: 'Biological Sprays', is_default: true },
    ],
    inventory_items: [
        {
            id: 'inv-1',
            farm_id: 'farm-1',
            category_id: 'cat-1',
            category_name: 'Packaging & Crates',
            name: 'Ventilated Plastic Crates (20 kg cap)',
            quantity: 180,
            unit: 'crates',
            cost_price: 320,
            notes: 'Food-grade HDPE crates for tomato and fruit transport.',
        },
        {
            id: 'inv-2',
            farm_id: 'farm-1',
            category_id: 'cat-3',
            category_name: 'Organic Fertiliser',
            name: 'Enriched Vermicompost',
            quantity: 45,
            unit: 'bags (50kg)',
            cost_price: 450,
            notes: 'Certified organic earthworm compost.',
        },
        {
            id: 'inv-3',
            farm_id: 'farm-1',
            category_id: 'cat-4',
            category_name: 'Biological Sprays',
            name: 'Neem Oil 10,000 PPM',
            quantity: 12,
            unit: 'litres',
            cost_price: 780,
            notes: 'Cold-pressed azadirachtin botanical spray.',
        },
    ],
    inventory_transactions: [],

    // ── WORKERS ───────────────────────────────────────────────────────────────
    workers: [
        {
            id: 'w-1',
            farm_id: 'farm-1',
            name: 'Raju Gowda',
            role: 'Harvesting & Grading Supervisor',
            phone: '+91 99801 11223',
            daily_wage: 650,
            is_active: true,
        },
        {
            id: 'w-2',
            farm_id: 'farm-1',
            name: 'Lakshmi Devi',
            role: 'Packing & Quality Sort Specialist',
            phone: '+91 99801 44556',
            daily_wage: 550,
            is_active: true,
        },
    ],
    worker_attendance: {},
    worker_transactions: [],

    // ── FINANCIALS ────────────────────────────────────────────────────────────
    financials: {
        summary: {
            revenue: 142500,
            expenses: 68400,
            profit: 74100,
        },
        recentTransactions: [
            { id: 'tx-1', type: 'Revenue', description: 'Marketplace Direct Sale — Tomatoes', amount: 18500, category: 'Crop Sale', date: '2025-08-22' },
            { id: 'tx-2', type: 'Expense', description: 'Purchase of 50 Harvest Crates', amount: 16000, category: 'Inventory Purchase', date: '2025-08-15' },
        ],
    },

    // ═════════════════════════════════════════════════════════════════════════
    // MARKETPLACE SPECIFIC DATA
    // ═════════════════════════════════════════════════════════════════════════

    // ── MARKETPLACE LISTINGS ──────────────────────────────────────────────────
    marketplace_listings: [],

    // ── HUB CONSIGNMENTS (Channel 2) ──────────────────────────────────────────
    hub_consignments: [],

    // ── MARKETPLACE ORDERS ────────────────────────────────────────────────────
    marketplace_orders: [],

    // ── B2B RFQs (Channel 3: Request for Quotes) ──────────────────────────────
    b2b_rfqs: [],
};
